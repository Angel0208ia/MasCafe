# Más Café

Aplicación móvil de pedidos para la cafetería universitaria. Permite consultar el menú completo, filtrar por categorías, personalizar cada producto y administrar el carrito antes de realizar el pedido.

## Funciones incluidas

- Menú de 65 productos organizado en 11 categorías.
- Categorías rápidas con nombres cortos.
- Variantes de tamaño y sabor sin repetir productos en el menú.
- Personalización de bebidas, alimentos y extras compatibles.
- Espresso normal por $35 o doble por $45.
- Selección de tipo de leche, temperatura y cantidad de hielo cuando corresponde.
- Selecciones múltiples con límites, por ejemplo los toppings del poke.
- Notas especiales y cantidad antes de agregar un producto.
- Carrito con las personalizaciones elegidas, cantidades y precio total.
- Botones para aumentar, reducir o eliminar productos del carrito.

## Tecnologías

- React Native
- Expo SDK 57
- Expo Router
- TypeScript
- Zustand

## Ejecutar el proyecto

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Inicia Expo:

   ```bash
   npx expo start
   ```

3. Escanea el código QR con Expo Go o presiona `a` para abrir el emulador de Android.

## Estructura principal

```text
src/
  app/
    products/          Menú y personalización
    cart/              Carrito
  components/          Tarjetas, categorías y navegación
  data/products.json   Catálogo y opciones disponibles
  store/               Estado del menú y carrito
  types/               Tipos de producto y personalización
```

Los extras ya no aparecen como productos independientes. Cada extra está asociado únicamente con los productos donde puede utilizarse.
