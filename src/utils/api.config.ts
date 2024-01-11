const windowOrigin = window.origin;

if (windowOrigin === 'https://evrc-verifier.everycred.com/') {
  console.log('dev');
} else if (windowOrigin === 'https://staging-verifier.everycred.com/') {
  console.log('staging');
} else if (windowOrigin === 'YYYYYYYYYYYYYYYYYYYYYYY') {
  console.log('prod');
} else {
  console.log('unknown');
}