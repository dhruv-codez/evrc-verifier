import { Buffer } from 'buffer';
import * as CryptoJS from 'crypto-js';
import { isEmpty } from 'lodash';
import sha256 from 'sha256';
import {
  ALGORITHM_TYPES,
  APPLICATION_JSON,
  BASE_API,
  BASE_NETWORK,
  BLOCKCHAIN_API_LIST,
  CHECKSUM_MERKLEPROOF_CHECK_KEYS,
  GENERAL_KEYWORDS,
  HTTP_METHODS,
  MERKLE_TREE,
  REQUEST_BODY
} from '../constants/common';
import { Messages } from '../constants/messages';
import { Stages } from '../constants/stages';
import { MERKLE_TREE_VALIDATION_API_URL } from '../utils/config';
import {
  deepCloneData,
  getDataFromAPI,
  getDataFromKey,
  isKeyPresent,
  isObjectEmpty
} from '../utils/credential-util';
import { logger } from '../utils/logger';
import { sleep } from '../utils/sleep';

export class MerkleProofValidator2019 {
  private credential: any;
  private decodedData: any;
  private normalizedDecodedData: any;
  private blockchainApiResponse: any;
  private isMerkleProofVerified: boolean = false;
  networkName: string = '';

  constructor(private progressCallback: (step: string, title: string, status: boolean, reason: string) => void) { }

  /**
   * The `validate` function performs various checks and validations on a given credential data and
   * returns a status and message indicating whether the validation was successful or not.
   * @param {any} credentialData - The `credentialData` parameter is an object that contains the data
   * needed for validation. It is passed to the `validate` function as an argument.
   * @returns an object with the properties `message`, `status`, and `networkName`.
   */
  async validate(credentialData: any): Promise<{ message: string; status: boolean; networkName: string; }> {
    await this.getData(credentialData);

    if (isObjectEmpty(this.decodedData)) {
      this.progressCallback(Stages.merkleProofValidation2019, Messages.FETCHING_NORMALIZED_DECODED_DATA, false, Messages.FETCHING_NORMALIZED_DECODED_DATA_ERROR);
      return { message: Messages.FETCHING_NORMALIZED_DECODED_DATA_ERROR, status: false, networkName: '' };
    }

    if (
      (await this.checkDecodedAnchors()).status &&
      (await this.checkDecodedPath()).status &&
      (await this.checkDecodedMerkleRoot()).status &&
      (await this.checkDecodedTargetHash()).status &&
      (await this.fetchDataFromBlockchainAPI()).status &&
      (await this.verifyMerkleProof()).status
    ) {
      const normalizedData = getDataFromKey(
        this.normalizedDecodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.get_byte_array_to_issue
      );
      const encodedHash = await this.calculateHash(normalizedData);

      if (this.isMerkleProofVerified && encodedHash === this.decodedData.targetHash) {
        this.progressCallback(Stages.verifyTargetHash, Messages.VALIDATE_TARGET_HASH, true, Messages.CALCULATED_HASH_MATCHES_WITH_TARGETHASH);
      } else {
        this.progressCallback(Stages.verifyTargetHash, Messages.VALIDATE_TARGET_HASH, false, Messages.CALCULATED_HASH_DIFFER_FROM_TARGETHASH);
        return { message: Messages.MERKLE_PROOF_2019_VALIDATION_FAILED, status: false, networkName: '' };
      }

      this.progressCallback(Stages.merkleProofValidation2019, Messages.MERKLE_PROOF_2019_VALIDATION, true, Messages.MERKLE_PROOF_2019_VALIDATION_SUCCESS);
      return { message: Messages.MERKLE_PROOF_2019_VALIDATION, status: true, networkName: this.networkName };
    }

    this.progressCallback(Stages.merkleProofValidation2019, Messages.MERKLE_PROOF_2019_VALIDATION, false, Messages.MERKLE_PROOF_2019_VALIDATION_FAILED);
    return { message: Messages.MERKLE_PROOF_2019_VALIDATION_FAILED, status: false, networkName: '' };
  }

  /**
   * The `getData` function takes in `credentialData` and performs different operations based on the type
   * of proof in the credential.
   * @param {any} credentialData - The `credentialData` parameter is an object that contains the data
   * needed for the credential. It is of type `any`, which means it can be any type of data.
   */
  private async getData(credentialData: any) {
    this.credential = deepCloneData(credentialData);

    switch (this.credential?.proof?.type) {
      case ALGORITHM_TYPES.MERKLEPROOF:
        this.normalizedDecodedData = await this.getNormalizedDecodedData(ALGORITHM_TYPES.MERKLEPROOF);
        this.decodedData = getDataFromKey(
          this.normalizedDecodedData,
          CHECKSUM_MERKLEPROOF_CHECK_KEYS.decoded_proof_value
        );
        break;

      case ALGORITHM_TYPES.AES:
        this.normalizedDecodedData = await this.getNormalizedDecodedData(ALGORITHM_TYPES.AES);
        this.decodedData = JSON.parse(await this.getAESDecodedData());
        break;

      default:
        this.decodedData = {};
        break;
    }
  }

  /**
   * The function `getAESDecodedData` decrypts a given proof value using AES encryption with a specified
   * key and initialization vector.
   * @returns The decrypted data as a string in UTF-8 encoding.
   */
  private async getAESDecodedData(): Promise<any> {
    const proofValue = getDataFromKey(
      this.credential.proof,
      CHECKSUM_MERKLEPROOF_CHECK_KEYS.proofValue
    );
    const AES_128_KEY = getDataFromKey(
      this.credential.proof.proofDecodingKeys,
      CHECKSUM_MERKLEPROOF_CHECK_KEYS.AES_128_KEY
    );
    const AES_128_IV = getDataFromKey(
      this.credential.proof.proofDecodingKeys,
      CHECKSUM_MERKLEPROOF_CHECK_KEYS.AES_128_IV
    );

    if (!proofValue?.length || !AES_128_IV?.length || !AES_128_KEY?.length) {
      this.progressCallback(Stages.getAESDecodedData, Messages.FETCHING_NORMALIZED_DECODED_DATA, false, Messages.FETCHING_AES_NORMALIZED_DECODED_DATA_ERROR);
      return {};
    }

    this.progressCallback(Stages.getAESDecodedData, Messages.FETCHING_NORMALIZED_DECODED_DATA, true, Messages.FETCHING_AES_NORMALIZED_DECODED_DATA_SUCCESS);
    return this.AESDecrypt(proofValue, AES_128_KEY, AES_128_IV);
  }

  /**
   * The function AESDecrypt takes a proofValue, AES_128_KEY, and AES_128_IV as input and uses AES
   * encryption to decrypt the proofValue and return the decrypted string.
   * @param {string} proofValue - The `proofValue` parameter is the encrypted value that you want to
   * decrypt using AES-128 encryption.
   * @param {string} AES_128_KEY - The AES_128_KEY parameter is a string that represents the 128-bit
   * encryption key used for AES decryption.
   * @param {string} AES_128_IV - The AES_128_IV parameter is the initialization vector used for AES
   * decryption. It is a string representation of the 128-bit IV value.
   * @returns a decrypted string.
   */
  private AESDecrypt(proofValue: string, AES_128_KEY: string, AES_128_IV: string): string {
    return CryptoJS.AES.decrypt(
      proofValue,
      CryptoJS.enc.Utf8.parse(AES_128_KEY),
      { iv: CryptoJS.enc.Utf8.parse(AES_128_IV), mode: CryptoJS.mode.CBC }
    ).toString(CryptoJS.enc.Utf8);
  }

  /**
   * The function `getNormalizedDecodedData` sends a POST request to an API with a JSON payload,
   * retrieves the response, validates it, and returns the response if it is valid.
   * @returns a Promise that resolves to an object of type `any`.
   */
  private async getNormalizedDecodedData(algorithm: string): Promise<any> {
    const apiUrl = `${MERKLE_TREE_VALIDATION_API_URL}${MERKLE_TREE.validation_api}${MERKLE_TREE.data_type}${MERKLE_TREE.algorithm}${algorithm}`;
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(this.credential)], { type: APPLICATION_JSON });
    formData.append(REQUEST_BODY, blob);

    const options = {
      method: HTTP_METHODS.POST,
      headers: {
        Accept: APPLICATION_JSON,
      },
      body: formData,
    };

    try {
      const apiResponse = (await getDataFromAPI(apiUrl, options))?.data;
      const isValidResponse = this.validateNormalizedDecodedData(apiResponse).status;

      if (isValidResponse) {
        return apiResponse;
      }
    } catch (error) {
      this.progressCallback(Stages.getNormalizedDecodedData, Messages.FETCHING_NORMALIZED_DECODED_DATA, false, Messages.FETCHING_NORMALIZED_DECODED_DATA_ERROR);
      return {};
    }
  }

  /**
 * The function validates the normalized decoded data and returns a status and message.
 * @param {any} response - The `response` parameter is an object that contains data received from an
 * API or some other source.
 * @returns an object with two properties: "message" and "status". The "message" property contains a
 * string value, and the "status" property contains a boolean value.
 */
  private validateNormalizedDecodedData(response: any): { message: string; status: boolean; } {
    if (
      !isKeyPresent(response, CHECKSUM_MERKLEPROOF_CHECK_KEYS.decoded_proof_value) &&
      !isKeyPresent(response, CHECKSUM_MERKLEPROOF_CHECK_KEYS.get_byte_array_to_issue)
    ) {
      this.progressCallback(Stages.getNormalizedDecodedData, Messages.FETCHING_NORMALIZED_DECODED_DATA, false, Messages.FETCHING_NORMALIZED_DECODED_DATA_ERROR);
      return { message: Messages.FETCHING_NORMALIZED_DECODED_DATA_ERROR, status: false };
    }

    this.progressCallback(Stages.getNormalizedDecodedData, Messages.FETCHING_NORMALIZED_DECODED_DATA, true, Messages.FETCHING_NORMALIZED_DECODED_DATA_SUCCESS);
    return { message: Messages.FETCHING_NORMALIZED_DECODED_DATA_SUCCESS, status: true };
  }

  /**
   * The function checks if the decoded anchors data is present and returns a status and message
   * accordingly.
   * @returns an object with two properties: "message" and "status". The "message" property is a string
   * and the "status" property is a boolean.
   */
  private async checkDecodedAnchors(): Promise<{ message: string; status: boolean; }> {
    await sleep(250);

    if (
      isKeyPresent(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.anchors
      )
    ) {
      const anchorsData = getDataFromKey(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.anchors
      );

      if (anchorsData?.length) {
        this.progressCallback(Stages.checkDecodedAnchors, Messages.ANCHOR_DECODED_DATA_KEY_VALIDATE, true, Messages.ANCHOR_DECODED_DATA_KEY_SUCCESS);
        return { message: Messages.ANCHOR_DECODED_DATA_KEY_SUCCESS, status: true };
      }
    }

    this.progressCallback(Stages.checkDecodedAnchors, Messages.ANCHOR_DECODED_DATA_KEY_VALIDATE, false, Messages.ANCHOR_DECODED_DATA_KEY_ERROR);
    return { message: Messages.ANCHOR_DECODED_DATA_KEY_ERROR, status: false };
  }

  /**
   * The function `checkDecodedPath` checks if a specific key is present in the `decodedData` object and
   * returns a status and message accordingly.
   * @returns an object with two properties: "message" and "status". The "message" property is an empty
   * string if a certain condition is met, otherwise it is set to the value of
   * "Messages.PATH_DECODED_DATA_KEY_ERROR". The "status" property is set to true if the condition is
   * met, otherwise it is set to false.
   */
  private async checkDecodedPath(): Promise<{ message: string; status: boolean; }> {
    await sleep(500);

    if (
      isKeyPresent(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.path
      )
    ) {
      this.progressCallback(Stages.checkDecodedPath, Messages.PATH_DECODED_DATA_KEY_VALIDATE, true, Messages.PATH_DECODED_DATA_KEY_SUCCESS);
      return { message: Messages.PATH_DECODED_DATA_KEY_SUCCESS, status: true };
    }

    this.progressCallback(Stages.checkDecodedPath, Messages.PATH_DECODED_DATA_KEY_VALIDATE, false, Messages.PATH_DECODED_DATA_KEY_ERROR);
    return { message: Messages.PATH_DECODED_DATA_KEY_ERROR, status: false };
  }

  /**
   * The function checks if a decoded merkle root is present and returns a message and status
   * indicating success or failure.
   * @returns a Promise that resolves to an object with two properties: "message" and "status". The
   * "message" property is a string and the "status" property is a boolean.
   */
  private async checkDecodedMerkleRoot(): Promise<{ message: string; status: boolean; }> {
    await sleep(750);

    if (
      isKeyPresent(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.merkleRoot
      )
    ) {
      const merkleRootData = getDataFromKey(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.merkleRoot
      );
      if (merkleRootData?.length && typeof merkleRootData === 'string') {
        this.progressCallback(Stages.checkDecodedMerkleRoot, Messages.MERKLEROOT_DECODED_DATA_KEY_VALIDATE, true, Messages.MERKLEROOT_DECODED_DATA_KEY_SUCCESS);
        return { message: Messages.MERKLEROOT_DECODED_DATA_KEY_SUCCESS, status: true };
      }
    }

    this.progressCallback(Stages.checkDecodedMerkleRoot, Messages.MERKLEROOT_DECODED_DATA_KEY_VALIDATE, false, Messages.MERKLEROOT_DECODED_DATA_KEY_ERROR);
    return { message: Messages.MERKLEROOT_DECODED_DATA_KEY_ERROR, status: false };
  }

  /**
   * The function checks if the target hash is present in the decoded data and returns a status and
   * message accordingly.
   * @returns an object with two properties: "message" and "status". The "message" property is a string
   * and the "status" property is a boolean.
   */
  private async checkDecodedTargetHash(): Promise<{ message: string; status: boolean; }> {
    await sleep(1000);

    if (
      isKeyPresent(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.targetHash
      )
    ) {
      const targetHashData = getDataFromKey(
        this.decodedData,
        CHECKSUM_MERKLEPROOF_CHECK_KEYS.targetHash
      );
      if (targetHashData?.length && typeof targetHashData === 'string') {
        this.progressCallback(Stages.checkDecodedTargetHash, Messages.TARGETHASH_DECODED_DATA_KEY_VALIDATE, true, Messages.TARGETHASH_DECODED_DATA_KEY_SUCCESS);
        return { message: Messages.TARGETHASH_DECODED_DATA_KEY_SUCCESS, status: true };
      }
    }

    this.progressCallback(Stages.checkDecodedTargetHash, Messages.TARGETHASH_DECODED_DATA_KEY_VALIDATE, false, Messages.TARGETHASH_DECODED_DATA_KEY_ERROR);
    return { message: Messages.TARGETHASH_DECODED_DATA_KEY_ERROR, status: false };
  }

  /**
   * The function fetchDataFromBlockchainAPI is an asynchronous function that fetches data from a
   * blockchain API and performs various error handling and logging operations.
   * @returns The function `fetchDataFromBlockchainAPI` returns a Promise that resolves to an object
   * with two properties: `message` and `status`.
   */
  private async fetchDataFromBlockchainAPI(): Promise<{ message: string; status: boolean; }> {
    // Fetching the selected anchor from decodedData
    const anchorParts = getDataFromKey(this.decodedData?.anchors, ['0'])?.split(':') || [];
    if (!anchorParts?.length) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.SELECTED_ANCHOR_RETRIEVAL_ERROR);
      return { message: Messages.SELECTED_ANCHOR_RETRIEVAL_ERROR, status: false };
    }

    // Extracting blinkValue, networkType, and transactionID from anchorParts
    const [blinkValue, networkType, transactionID] = [
      getDataFromKey(anchorParts, ['1']),
      getDataFromKey(anchorParts, ['2']),
      getDataFromKey(anchorParts, ['3'])
    ];

    if (!blinkValue || !networkType || !transactionID) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.REQUIRED_VALUES_RETRIEVAL_ERROR);
      return { message: Messages.REQUIRED_VALUES_RETRIEVAL_ERROR, status: false };
    }

    // Retrieving baseAPIValue and baseNetworkValue using blinkValue and networkType
    const baseAPIValue = getDataFromKey(BASE_API, blinkValue);
    const baseNetworkValue = getDataFromKey(BASE_NETWORK, networkType);

    if (!baseAPIValue || !baseNetworkValue) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.BASE_API_OR_NETWORK_RETRIEVAL_ERROR);
      return { message: Messages.BASE_API_OR_NETWORK_RETRIEVAL_ERROR, status: false };
    }

    this.networkName = `${baseAPIValue}${baseNetworkValue}`;

    // Finding the matchedAPI based on baseAPIValue and baseNetworkValue
    const matchedAPI = BLOCKCHAIN_API_LIST.find(api => api.id === this.networkName);

    if (!matchedAPI) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.NO_MATCHING_API_FOUND_ERROR);
      return { message: Messages.NO_MATCHING_API_FOUND_ERROR, status: false };
    }

    // Retrieving the URL and apiKey from matchedAPI
    const url = getDataFromKey(matchedAPI, GENERAL_KEYWORDS.url);
    const apiKey = getDataFromKey(matchedAPI, GENERAL_KEYWORDS.apiKey);

    if (!url || !apiKey) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.URL_OR_APIKEY_RETRIEVAL_ERROR);
      return { message: Messages.URL_OR_APIKEY_RETRIEVAL_ERROR, status: false };
    }

    // Building the final URL using buildTransactionUrl method
    const finalUrl = await this.buildTransactionUrl(url, apiKey, transactionID);

    try {
      // Fetching data from the API using finalUrl
      this.blockchainApiResponse = await getDataFromAPI(finalUrl);
    } catch (error) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.TRANSACTION_NOT_FOUND_ERROR);
      return { message: Messages.TRANSACTION_NOT_FOUND_ERROR, status: false };
    }

    if (!isEmpty(this.blockchainApiResponse)) {
      this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, true, Messages.DATA_FETCHED_SUCCESS);
      return { message: Messages.DATA_FETCHED_SUCCESS, status: true };
    }

    this.progressCallback(Stages.fetchDataFromBlockchainAPI, Messages.BLOCKCHAIN_DATA_VALIDATE, false, Messages.DATA_FETCHED_ERROR);
    return { message: Messages.DATA_FETCHED_ERROR, status: false };
  }

  /**
   * The function `verifyMerkleProof` takes in decoded data and verifies the Merkle proof by calculating
   * the hash and comparing it with the Merkle root.
   * @param {any} decodedData - The `decodedData` parameter is an object that contains the following
   * properties:
   * @returns The function `verifyMerkleProof` returns an object with two properties: `message` and
   * `status`. The `message` property contains a string message indicating whether the calculated hash
   * matches with the merkle root or not. The `status` property is a boolean value indicating whether the
   * merkle proof is verified or not.
   */
  private async verifyMerkleProof(): Promise<{ message: string; status: boolean; }> {
    const targetHash = getDataFromKey(
      this.decodedData,
      CHECKSUM_MERKLEPROOF_CHECK_KEYS.targetHash
    );
    const merkleRoot = getDataFromKey(
      this.decodedData,
      CHECKSUM_MERKLEPROOF_CHECK_KEYS.merkleRoot
    );
    const path = getDataFromKey(
      this.decodedData,
      CHECKSUM_MERKLEPROOF_CHECK_KEYS.path
    );

    if (!targetHash?.length || !merkleRoot?.length) {
      this.isMerkleProofVerified = false;
      this.progressCallback(Stages.verifyMerkleProof, Messages.MERKLE_PROOF_VALIDATE, false, Messages.MERKLEROOT_DECODED_DATA_KEY_ERROR);
      return { message: Messages.MERKLEROOT_DECODED_DATA_KEY_ERROR, status: this.isMerkleProofVerified };
    }

    let currentHash = targetHash;

    for (const proofElement of path) {
      if (proofElement.left) {
        const concatenatedHash = proofElement.left + currentHash;
        const buffer = Buffer.from(concatenatedHash, 'hex');
        currentHash = await this.calculateHash(buffer);
      } else if (proofElement.right) {
        const concatenatedHash = currentHash + proofElement.right;
        const buffer = Buffer.from(concatenatedHash, 'hex');
        currentHash = await this.calculateHash(buffer);
      }
    }

    this.isMerkleProofVerified = currentHash === merkleRoot;

    if (!this.isMerkleProofVerified) {
      this.progressCallback(Stages.verifyMerkleProof, Messages.MERKLE_PROOF_VALIDATE, false, Messages.CALCULATED_HASH_DIFFER_FROM_MERKLEROOT);
      logger(Messages.CALCULATED_HASH_DIFFER_FROM_MERKLEROOT, "error");
    }

    this.progressCallback(
      Stages.verifyMerkleProof,
      Messages.MERKLE_PROOF_VALIDATE,
      this.isMerkleProofVerified,
      this.isMerkleProofVerified
        ? Messages.CALCULATED_HASH_MATCHES_WITH_MERKLEROOT
        : Messages.CALCULATED_HASH_DIFFER_FROM_MERKLEROOT
    );
    return {
      message: this.isMerkleProofVerified
        ? Messages.CALCULATED_HASH_MATCHES_WITH_MERKLEROOT
        : Messages.CALCULATED_HASH_DIFFER_FROM_MERKLEROOT,
      status: this.isMerkleProofVerified
    };
  }

  /**
   * The function builds a transaction URL by concatenating the base URL, endpoint, and query parameters.
   * @param {string} url - The `url` parameter is the base URL of the API endpoint you want to call. It
   * should be a string representing the URL of the API server.
   * @param {string} apiKey - The `apiKey` parameter is a string that represents the API key required to
   * access the API endpoint. This key is used to authenticate the user and ensure that only authorized
   * users can access the endpoint.
   * @param {string} transactionID - The `transactionID` parameter is a string that represents the hash
   * of a transaction in the Ethereum blockchain.
   * @returns a string that represents the complete transaction URL.
   */
  private async buildTransactionUrl(url: string, apiKey: string, transactionID: string): Promise<string> {
    const endpoint = "api?module=proxy&action=eth_getTransactionByHash";
    const queryParams = `&apikey=${apiKey}&txhash=${transactionID}`;

    return `${url}${endpoint}${queryParams}`;
  }

  /**
   * The function calculates the SHA256 hash of the given data.
   * @param {any} data - The `data` parameter is the input data for which you want to calculate the hash.
   * It can be of any type, such as a string, number, object, or array.
   * @returns The calculateHash function is returning the result of the sha256 function, which is the
   * hash value of the input data.
   */
  private async calculateHash(data: any) {
    return sha256(data);
  }

}