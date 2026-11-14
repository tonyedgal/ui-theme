/** A `<style>` element allowed by a `style-src 'nonce-…'` policy. */
export const createStyle = (nonce?: string) => {
  const style = document.createElement('style');

  if (nonce) style.nonce = nonce;

  return style;
};
