export enum Stages {
  verification = 'verification',
  validateCredentials = 'validateCredentials',
  validateCredential = 'validateCredential',
  validateCredentialType = 'validateCredentialType',
  validateCredentialContext = 'validateCredentialContext',
  validateCredentialID = 'validateCredentialID',
  validateCredentialSubject = 'validateCredentialSubject',
  validateCredentialProof = 'validateCredentialProof',
  validateCredentialIssuanceDate = 'validateCredentialIssuanceDate',
  validateIssuerCredentials = 'validateIssuerCredentials',
  validateCredentialIssuer = 'validateCredentialIssuer',
  validateIssuerProfileContext = 'validateIssuerProfileContext',
  validateIssuerCredentialType = 'validateIssuerCredentialType',
  validateIssuerProfileID = 'validateIssuerProfileID',
  validateIssuerProfileName = 'validateIssuerProfileName',
  validateIssuerProfileEmail = 'validateIssuerProfileEmail',
  validateIssuerProfileRevocationList = 'validateIssuerProfileRevocationList',
  validateIssuerProfilePublicKey = 'validateIssuerProfilePublicKey',
  validateRevocationListFromIssuerProfile = 'validateRevocationListFromIssuerProfile',
  merkleProofValidation2019 = 'merkleProofValidation2019',
  getAESDecodedData = 'getAESDecodedData',
  getNormalizedDecodedData = 'getNormalizedDecodedData',
  checkDecodedAnchors = 'checkDecodedAnchors',
  checkDecodedPath = 'checkDecodedPath',
  checkDecodedMerkleRoot = 'checkDecodedMerkleRoot',
  checkDecodedTargetHash = 'checkDecodedTargetHash',
  fetchDataFromBlockchainAPI = 'fetchDataFromBlockchainAPI',
  verifyMerkleProof = 'verifyMerkleProof',
  verifyTargetHash = 'verifyTargetHash',
  revocationStatusCheck = 'revocationStatusCheck',
  checkRevocationContext = 'checkRevocationContext',
  checkRevocationType = 'checkRevocationType',
  checkRevocationID = 'checkRevocationID',
  checkRevocationIssuer = 'checkRevocationIssuer',
  checkRevocationRevokedAssertions = 'checkRevocationRevokedAssertions',
  checkValidUntilDate = 'checkValidUntilDate',
}