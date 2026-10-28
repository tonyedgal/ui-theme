if (new URLSearchParams(location.search).get('framework') === 'vue') {
  await import('./vue');
} else {
  await import('./react');
}
