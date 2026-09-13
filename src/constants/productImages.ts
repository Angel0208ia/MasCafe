/** Usa solo la foto configurada; los artículos sin foto no recuperan imágenes de prueba. */
export function getProductImage(_productId: string, currentImage: string): string {
  return typeof currentImage === 'string' ? currentImage.trim() : '';
}
