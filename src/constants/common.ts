/* Defining a constant object called `CREDENTIALS_CONSTANTS` which contains various properties related
to verifiable credentials. These properties include the type of verifiable credential, the context
values, the required keys for the credential subject and proof, the supported proof type, the
context values for the issuer profile, the supported issuer profile type, and the required public
key fields for the issuer profile. This object can be exported and used in other parts of the code
to ensure consistency in the values used for verifiable credentials. */
export const CREDENTIALS_CONSTANTS = {
  verifiable_credential: "VerifiableCredential",
  context_values: [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/v2",
  ],
  credentialSubjectRequiredKeys: ["id", "name", "image"],
  proofRequiredKeys: [
    "type",
    "created",
    "proofPurpose",
    "proofValue",
    "verificationMethod",
  ],
  proofTypeSupported: ["MerkleProof2019", 'AES-128'],
  issuer_profile_context_values: [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/v2",
    "https://w3id.org/openbadges/v2",
  ],
  issuerProfileTypeSupported: ["Profile"],
  issuerProfilePublicKeyFields: ["id", "created"],
  revocation_list_context_values: [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/v2",
    "https://w3id.org/openbadges/v2",
  ],
  revocation_list_type_supported: "RevocationList",
};

/* Defining an enum called `CREDENTIALS_VALIDATORS_KEYS` which contains keys used for validating the
properties of a verifiable credential. Each key is assigned a string value. This enum can be
exported and used in other parts of the code to ensure consistency in the keys used for validation. */
export enum CREDENTIALS_VALIDATORS_KEYS {
  type = "type",
  context = "@context",
  id = "id",
  credentialSubject = "credentialSubject",
  proof = "proof",
  issuanceDate = "issuanceDate",
  validUntilDate = "validUntil"
}

/* Defining an enum called `CREDENTIALS_ISSUER_VALIDATORS_KEYS` which contains keys used for validating
the properties of a verifiable credential issuer. Each key is assigned a string value. This enum can
be exported and used in other parts of the code to ensure consistency in the keys used for
validation. */
export enum CREDENTIALS_ISSUER_VALIDATORS_KEYS {
  issuer = "issuer",
  context = "@context",
  type = "type",
  id = "id",
  name = "name",
  email = "email",
  revocationList = "revocationList",
  publicKey = "publicKey",
}

/* Defining an enum called `STATUS_REVOCATION_CHECK` which contains keys used for checking the status
of a revocation check. Each key is assigned a string value. This enum can be exported and used in
other parts of the code to ensure consistency in the keys used for revocation check. */
export enum REVOCATION_STATUS_CHECK_KEYS {
  context = "@context",
  type = "type",
  id = "id",
  issuer = "issuer",
  revokedAssertions = "revokedAssertions",
}

/* The `CHECKSUM_MERKLEPROOF_CHECK_KEYS` enum is defining a set of keys that are used for checking the
properties of a MerkleProof checksum. Each key is assigned a string value that represents a specific
property of the checksum. */
export enum CHECKSUM_MERKLEPROOF_CHECK_KEYS {
  decoded_proof_value = "decoded_proof_value",
  get_byte_array_to_issue = "get_byte_array_to_issue",
  anchors = "anchors",
  path = "path",
  merkleRoot = "merkleRoot",
  targetHash = "targetHash",
  proofValue = 'proofValue',
  AES_128_KEY = 'AES_128_KEY',
  AES_128_IV = 'AES_128_IV',
}

/* The `BLOCKCHAIN_API_LIST` constant is an array of objects that contains information about different
blockchain APIs. Each object in the array represents a specific blockchain API and includes
properties such as `id`, `url`, and `apiKey`. */
export const BLOCKCHAIN_API_LIST = [
  { id: "ethereumMainnet", url: "https://api.etherscan.io/", apiKey: "9RS1QFI8HR3WF11YKESZYRJCW44QC4W1G7" },
  { id: "ethereumSepolia", url: "https://api-sepolia.etherscan.io/", apiKey: "9RS1QFI8HR3WF11YKESZYRJCW44QC4W1G7" },
  { id: "polygonMainnet", url: "https://api.polygonscan.com/", apiKey: "Z6G5RJPZIP7WFXZTJE2MRY1191XCR7X955" },
  { id: "polygonTestnet", url: "https://api-testnet.polygonscan.com/", apiKey: "Z6G5RJPZIP7WFXZTJE2MRY1191XCR7X955" },
];

/* The `export enum BASE_API` is defining an enumeration called `BASE_API` that represents different
blockchain APIs. It assigns string values to each enum member, where `eth` is assigned the value
`"ethereum"` and `poly` is assigned the value `"polygon"`. This enum can be exported and used in
other parts of the code to refer to specific blockchain APIs, providing a convenient way to ensure
consistency in the values used for different APIs. */
export enum BASE_API {
  eth = "ethereum",
  poly = "polygon",
}

/* The `export enum BASE_NETWORK` is defining an enumeration called `BASE_NETWORK` that represents
different network types. It assigns string values to each enum member, where `sepolia` is assigned
the value `"Sepolia"`, `mainnet` is assigned the value `"Mainnet"`, and `testnet` is assigned the
value `"Testnet"`. */
export enum BASE_NETWORK {
  sepolia = "Sepolia",
  mainnet = "Mainnet",
  testnet = "Testnet",
}

/* The `export enum GENERAL_KEYWORDS` is defining an enumeration called `GENERAL_KEYWORDS` that
represents general keywords used in the code. It assigns string values to each enum member, where
`url` is assigned the value `"url"` and `apiKey` is assigned the value `"apiKey"`. */
export enum GENERAL_KEYWORDS {
  url = "url",
  apiKey = "apiKey"
}

/* The `MERKLE_TREE` constant is an object that contains properties related to the validation of a
Merkle tree. */
export const MERKLE_TREE = {
  validation_api: "/user/credential/markel_tree_verification?merkel_tree_data=",
  data_type: "normalize_data",
  algorithm: "&algorithm="
};

/* The `export enum HTTP_METHODS` is defining an enumeration called `HTTP_METHODS` that represents
different HTTP methods. It assigns string values to each enum member, where `GET` is assigned the
value `"GET"`, `POST` is assigned the value `"POST"`, `PUT` is assigned the value `"PUT"`, `PATCH`
is assigned the value `"PATCH"`, and `DELETE` is assigned the value `"DELETE"`. */
export enum HTTP_METHODS {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/* The `export enum ALGORITHM_TYPES` is defining an enumeration called `ALGORITHM_TYPES` that
represents different algorithm types. It assigns string values to each enum member, where
`MERKLEPROOF` is assigned the value `"MerkleProof2019"` and `AES` is assigned the value `"AES-128"`.
This enum can be exported and used in other parts of the code to refer to specific algorithm types,
providing a convenient way to ensure consistency in the values used for different algorithms. */
export enum ALGORITHM_TYPES {
  MERKLEPROOF = 'MerkleProof2019',
  AES = 'AES-128'
}

export const APPLICATION_JSON = 'application/json';
export const REQUEST_BODY = 'body';

export enum EnvironmentApis {
  Production = 'https://verifier.everycred.com',
  Staging = 'https://staging-verifier.everycred.com',
  Development = 'https://evrc-verifier.everycred.com',
  Local = 'http://localhost:4200',
}

export const API_URLS = new Map<EnvironmentApis, string>([
  [EnvironmentApis.Production, 'https://product-api.everycred.com'],
  [EnvironmentApis.Staging, 'https://service-api.everycred.com'],
  [EnvironmentApis.Development, 'https://evrc-service.everycred.com'],
  [EnvironmentApis.Local, 'https://evrc-service.everycred.com'],
]);

export const DEFAULT_API_URL = 'https://product-api.everycred.com';
