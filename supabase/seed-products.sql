-- Generado desde src/data/products.json. No editar a mano.

begin;

insert into public.products (
  id, name, description, image, category, base_price, available, customizations
) values
(
  '1',
  'Americano',
  'Espresso con agua caliente, de sabor intenso y aromático.',
  'https://loremflickr.com/640/480/americano,coffee?lock=1',
  'Café',
  45,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"small","name":"Chico","extraPrice":0},{"id":"large","name":"Grande","extraPrice":5}]}]'::jsonb
),
(
  '2',
  'Cappuccino',
  'Espresso con leche vaporizada y espuma cremosa.',
  'https://loremflickr.com/640/480/cappuccino,coffee?lock=2',
  'Café',
  60,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '3',
  'Latte',
  'Espresso suave con abundante leche vaporizada.',
  'https://loremflickr.com/640/480/latte,coffee?lock=3',
  'Café',
  60,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '4',
  'Espresso',
  'Café concentrado de sabor intenso y aromático.',
  'https://loremflickr.com/640/480/espresso,coffee?lock=4',
  'Café',
  35,
  true,
  '[{"id":"espresso_shots","name":"Elige tu espresso","type":"single","required":true,"options":[{"id":"normal","name":"Normal","extraPrice":0},{"id":"double","name":"Doble","extraPrice":10}]}]'::jsonb
),
(
  '5',
  'Moka',
  'Espresso con leche y un delicioso toque de chocolate.',
  'https://loremflickr.com/640/480/mocha,coffee?lock=5',
  'Café',
  60,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '6',
  'Iced Coffee Bear',
  'Café frío y cremoso servido con hielo.',
  'https://loremflickr.com/640/480/iced,coffee?lock=6',
  'Café',
  55,
  true,
  '[{"id":"flavor","name":"Sabor","type":"single","required":true,"options":[{"id":"original","name":"Original","extraPrice":0},{"id":"latte","name":"Latte","extraPrice":5},{"id":"caramel","name":"Caramelo","extraPrice":10}]},{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0},{"id":"extra","name":"Hielo extra","extraPrice":0}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '7',
  'Matcha',
  'Bebida cremosa preparada con té verde matcha.',
  'https://loremflickr.com/640/480/matcha,latte?lock=7',
  'Bebidas',
  65,
  true,
  '[{"id":"temperature","name":"Temperatura","type":"single","required":true,"options":[{"id":"hot","name":"Caliente","extraPrice":0},{"id":"cold","name":"Frío","extraPrice":0}]},{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0},{"id":"extra","name":"Hielo extra","extraPrice":0}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '8',
  'Matcha Griego',
  'Matcha cremoso con un toque estilo griego.',
  'https://loremflickr.com/640/480/matcha,yogurt?lock=8',
  'Bebidas',
  70,
  true,
  '[]'::jsonb
),
(
  '9',
  'Chai',
  'Té especiado con leche, aromático y cremoso.',
  'https://loremflickr.com/640/480/chai,latte?lock=9',
  'Bebidas',
  60,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '10',
  'Chocolate Caliente',
  'Chocolate caliente, dulce y cremoso.',
  'https://loremflickr.com/640/480/hot,chocolate?lock=10',
  'Bebidas',
  55,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '11',
  'Affogato',
  'Helado acompañado con una carga de espresso.',
  'https://loremflickr.com/640/480/affogato,coffee?lock=11',
  'Café',
  70,
  true,
  '[]'::jsonb
),
(
  '12',
  'Mazapán Latte',
  'Latte cremoso con sabor dulce a mazapán.',
  'https://loremflickr.com/640/480/latte,peanut?lock=12',
  'Café',
  50,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '13',
  'Té',
  'Té ligero disponible frío o caliente.',
  'https://loremflickr.com/640/480/tea,drink?lock=13',
  'Bebidas',
  30,
  true,
  '[{"id":"temperature","name":"Temperatura","type":"single","required":true,"options":[{"id":"hot","name":"Caliente","extraPrice":0},{"id":"cold","name":"Frío","extraPrice":0}]},{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0}]}]'::jsonb
),
(
  '14',
  'Tisana',
  'Infusión frutal disponible fría o caliente.',
  'https://loremflickr.com/640/480/fruit,tea?lock=14',
  'Bebidas',
  50,
  true,
  '[{"id":"temperature","name":"Temperatura","type":"single","required":true,"options":[{"id":"hot","name":"Caliente","extraPrice":0},{"id":"cold","name":"Frío","extraPrice":0}]},{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0}]}]'::jsonb
),
(
  '15',
  'Limonada Lavanda',
  'Limonada refrescante con un toque floral.',
  'https://loremflickr.com/640/480/lavender,lemonade?lock=15',
  'Bebidas',
  50,
  true,
  '[{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0},{"id":"extra","name":"Hielo extra","extraPrice":0}]}]'::jsonb
),
(
  '16',
  'Agua Fresca',
  'Bebida fresca preparada con sabores naturales.',
  'https://loremflickr.com/640/480/agua,fresca?lock=16',
  'Bebidas',
  25,
  true,
  '[{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0}]}]'::jsonb
),
(
  '17',
  'Agua 500 ml',
  'Botella de agua natural de 500 ml.',
  'https://loremflickr.com/640/480/water,bottle?lock=17',
  'Bebidas',
  15,
  true,
  '[]'::jsonb
),
(
  '18',
  'Refresher',
  'Bebida fría, ligera y refrescante.',
  'https://loremflickr.com/640/480/refreshing,fruit,drink?lock=18',
  'Bebidas',
  55,
  true,
  '[{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Con hielo","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"none","name":"Sin hielo","extraPrice":0},{"id":"extra","name":"Hielo extra","extraPrice":0}]}]'::jsonb
),
(
  '19',
  'Licuado de Fresa',
  'Licuado cremoso preparado con fresa.',
  'https://loremflickr.com/640/480/strawberry,smoothie?lock=19',
  'Licuados',
  55,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"500ml","name":"500 ml","extraPrice":0},{"id":"1l","name":"1 litro","extraPrice":10}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '20',
  'Licuado de Plátano',
  'Licuado cremoso preparado con plátano.',
  'https://loremflickr.com/640/480/banana,smoothie?lock=20',
  'Licuados',
  55,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"500ml","name":"500 ml","extraPrice":0},{"id":"1l","name":"1 litro","extraPrice":10}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '21',
  'Licuado de Avena',
  'Licuado suave y cremoso preparado con avena.',
  'https://loremflickr.com/640/480/oat,smoothie?lock=21',
  'Licuados',
  55,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"500ml","name":"500 ml","extraPrice":0},{"id":"1l","name":"1 litro","extraPrice":10}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '22',
  'Choco Cacao',
  'Licuado cremoso con intenso sabor a cacao.',
  'https://loremflickr.com/640/480/chocolate,smoothie?lock=22',
  'Licuados',
  55,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"500ml","name":"500 ml","extraPrice":0},{"id":"1l","name":"1 litro","extraPrice":10}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '23',
  'Licuado Combinado',
  'Combina dos ingredientes en un solo licuado.',
  'https://loremflickr.com/640/480/fruit,smoothie?lock=23',
  'Licuados',
  60,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"500ml","name":"500 ml","extraPrice":0},{"id":"1l","name":"1 litro","extraPrice":10}]},{"id":"ingredients","name":"Elige dos ingredientes","type":"multiple","required":true,"minSelections":2,"maxSelections":2,"options":[{"id":"strawberry","name":"Fresa","extraPrice":0},{"id":"banana","name":"Plátano","extraPrice":0},{"id":"oat","name":"Avena","extraPrice":0},{"id":"cacao","name":"Cacao","extraPrice":0}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '24',
  'El Tornado',
  'Fresa, plátano, avena y cacao.',
  'https://loremflickr.com/640/480/banana,strawberry,smoothie?lock=24',
  'Licuados',
  65,
  true,
  '[{"id":"size","name":"Tamaño","type":"single","required":true,"options":[{"id":"500ml","name":"500 ml","extraPrice":0},{"id":"1l","name":"1 litro","extraPrice":10}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '25',
  'Frappé Cappuccino',
  'Bebida frappé de cappuccino preparada con leche.',
  'https://loremflickr.com/640/480/frappe,cappuccino?lock=25',
  'Frappés',
  70,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]},{"id":"ice","name":"Cantidad de hielo","type":"single","required":true,"options":[{"id":"normal","name":"Normal","extraPrice":0},{"id":"light","name":"Poco hielo","extraPrice":0},{"id":"extra","name":"Hielo extra","extraPrice":0}]}]'::jsonb
),
(
  '26',
  'Frappé de Fresa con Yogur',
  'Frappé cremoso de fresa preparado con yogur.',
  'https://loremflickr.com/640/480/strawberry,yogurt,smoothie?lock=26',
  'Frappés',
  70,
  true,
  '[]'::jsonb
),
(
  '27',
  'Frappé de Fresa con Agua',
  'Frappé refrescante de fresa preparado con agua.',
  'https://loremflickr.com/640/480/strawberry,slush?lock=27',
  'Frappés',
  65,
  true,
  '[]'::jsonb
),
(
  '28',
  'Frappé de Cacao',
  'Frappé cremoso de cacao preparado con leche.',
  'https://loremflickr.com/640/480/chocolate,frappe?lock=28',
  'Frappés',
  70,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '29',
  'Frappé de Frutos Rojos',
  'Frappé refrescante de frutos rojos con agua.',
  'https://loremflickr.com/640/480/berry,frappe?lock=29',
  'Frappés',
  65,
  true,
  '[]'::jsonb
),
(
  '30',
  'Frappé de Taro',
  'Frappé cremoso con sabor dulce a taro.',
  'https://loremflickr.com/640/480/taro,milk,tea?lock=30',
  'Frappés',
  70,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '31',
  'Frappé de Matcha',
  'Frappé cremoso preparado con té verde matcha.',
  'https://loremflickr.com/640/480/matcha,frappe?lock=31',
  'Frappés',
  70,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '32',
  'Frappé Matcha Taro',
  'Combinación cremosa de matcha y taro.',
  'https://loremflickr.com/640/480/matcha,taro,drink?lock=32',
  'Frappés',
  70,
  true,
  '[{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"lactose-free","name":"Deslactosada","extraPrice":12},{"id":"almond","name":"Almendras","extraPrice":12}]}]'::jsonb
),
(
  '33',
  'Piña Colada Granizada',
  'Granizado tropical con sabor a piña colada.',
  'https://loremflickr.com/640/480/pina,colada,drink?lock=33',
  'Granizados',
  40,
  true,
  '[]'::jsonb
),
(
  '34',
  'Mango Chamoyada',
  'Granizado de mango con un toque de chamoy.',
  'https://loremflickr.com/640/480/mango,chamoy,drink?lock=34',
  'Granizados',
  40,
  true,
  '[]'::jsonb
),
(
  '35',
  'Chilaquilitos',
  'Totopos con salsa y acompañamientos clásicos.',
  'https://loremflickr.com/640/480/chilaquiles,mexican,food?lock=35',
  'Pancita llena, corazón contento',
  50,
  true,
  '[{"id":"sauce","name":"Salsa","type":"single","required":true,"options":[{"id":"green","name":"Verde","extraPrice":0},{"id":"red","name":"Roja","extraPrice":0}]},{"id":"protein","name":"Proteína","type":"single","required":true,"options":[{"id":"none","name":"Sin pollo","extraPrice":0},{"id":"chicken","name":"Con pollo","extraPrice":15}]}]'::jsonb
),
(
  '36',
  'Molletes',
  'Pan tostado con frijoles y queso gratinado.',
  'https://loremflickr.com/640/480/molletes,mexican,food?lock=36',
  'Pancita llena, corazón contento',
  50,
  true,
  '[{"id":"ham","name":"Preparación","type":"single","required":true,"options":[{"id":"classic","name":"Clásicos","extraPrice":0},{"id":"with-ham","name":"Con jamón","extraPrice":10}]}]'::jsonb
),
(
  '37',
  'Burrito',
  'Tortilla rellena con proteína y acompañamientos.',
  'https://loremflickr.com/640/480/burrito,mexican,food?lock=37',
  'Pancita llena, corazón contento',
  60,
  true,
  '[{"id":"protein","name":"Elige tu burrito","type":"single","required":true,"options":[{"id":"chicken","name":"Pollo","extraPrice":0},{"id":"cecina","name":"Cecina","extraPrice":10},{"id":"chilorio","name":"Chilorio","extraPrice":10}]}]'::jsonb
),
(
  '38',
  'Cuernito',
  'Pan tipo croissant relleno y preparado al momento.',
  'https://loremflickr.com/640/480/croissant,sandwich?lock=38',
  'Pancita llena, corazón contento',
  60,
  true,
  '[]'::jsonb
),
(
  '39',
  'Croissant',
  'Croissant dorado con relleno estilo cafetería.',
  'https://loremflickr.com/640/480/croissant,food?lock=39',
  'Pancita llena, corazón contento',
  70,
  true,
  '[]'::jsonb
),
(
  '40',
  'Mini Hotcakes',
  'Mini hotcakes suaves con el acompañamiento que prefieras.',
  'https://loremflickr.com/640/480/pancakes,honey?lock=40',
  'Pancita llena, corazón contento',
  50,
  true,
  '[{"id":"topping","name":"Acompañamiento","type":"single","required":true,"options":[{"id":"honey","name":"Miel","extraPrice":0},{"id":"banana","name":"Plátano","extraPrice":10},{"id":"strawberry","name":"Fresa","extraPrice":10}]}]'::jsonb
),
(
  '41',
  'Torta',
  'Torta preparada al momento con relleno a elegir.',
  'https://loremflickr.com/640/480/mexican,sandwich?lock=41',
  'Pancita llena, corazón contento',
  40,
  true,
  '[{"id":"filling","name":"Elige tu torta","type":"single","required":true,"options":[{"id":"chavo","name":"Del Chavo","extraPrice":0},{"id":"cecina","name":"Cecina","extraPrice":20}]}]'::jsonb
),
(
  '42',
  'Chapata',
  'Pan chapata relleno y preparado al momento.',
  'https://loremflickr.com/640/480/ciabatta,sandwich?lock=42',
  'Pancita llena, corazón contento',
  60,
  true,
  '[]'::jsonb
),
(
  '43',
  'Waffle Sandwich',
  'Sándwich preparado entre waffles dorados.',
  'https://loremflickr.com/640/480/waffle,sandwich?lock=43',
  'Pancita llena, corazón contento',
  70,
  true,
  '[]'::jsonb
),
(
  '44',
  'Sushi Cake',
  'Arroz, alga, proteína, pepino, queso y ajonjolí.',
  'https://loremflickr.com/640/480/sushi,cake?lock=44',
  'Pancita llena, corazón contento',
  50,
  true,
  '[{"id":"protein","name":"Proteína","type":"single","required":true,"options":[{"id":"surimi","name":"Surimi","extraPrice":0},{"id":"tuna","name":"Atún","extraPrice":0}]},{"id":"extras","name":"Extras","type":"multiple","required":false,"maxSelections":2,"options":[{"id":"extra-protein","name":"Proteína extra","extraPrice":18},{"id":"eel","name":"Anguila","extraPrice":10}]}]'::jsonb
),
(
  '45',
  'Poke',
  'Bowl con proteína, cuatro toppings y un ingrediente crujiente.',
  'https://loremflickr.com/640/480/poke,bowl?lock=45',
  'Pancita llena, corazón contento',
  60,
  true,
  '[{"id":"protein","name":"Proteína","type":"single","required":true,"options":[{"id":"surimi","name":"Surimi","extraPrice":0},{"id":"tuna","name":"Atún","extraPrice":0},{"id":"chicken","name":"Pollo","extraPrice":0}]},{"id":"toppings","name":"Toppings","type":"multiple","required":true,"minSelections":4,"maxSelections":4,"options":[{"id":"cucumber","name":"Pepino","extraPrice":0},{"id":"carrot","name":"Zanahoria","extraPrice":0},{"id":"avocado","name":"Aguacate","extraPrice":0},{"id":"edamame","name":"Edamame","extraPrice":0},{"id":"mango","name":"Mango","extraPrice":0},{"id":"cream-cheese","name":"Queso crema","extraPrice":0}]},{"id":"crunchy","name":"Crujiente","type":"single","required":true,"options":[{"id":"sesame","name":"Ajonjolí","extraPrice":0},{"id":"peanut","name":"Cacahuate","extraPrice":0},{"id":"fried-onion","name":"Cebolla crujiente","extraPrice":0}]},{"id":"extras","name":"Extras","type":"multiple","required":false,"maxSelections":2,"options":[{"id":"extra-protein","name":"Proteína extra","extraPrice":18},{"id":"eel","name":"Anguila","extraPrice":10}]}]'::jsonb
),
(
  '46',
  'Baguette',
  'Baguette crujiente rellena estilo cafetería.',
  'https://loremflickr.com/640/480/baguette,sandwich?lock=46',
  'Pancita llena, corazón contento',
  70,
  true,
  '[]'::jsonb
),
(
  '47',
  'Ensalada Rusa',
  'Ensalada cremosa de papa y vegetales.',
  'https://loremflickr.com/640/480/potato,salad?lock=47',
  'Pancita llena, corazón contento',
  60,
  true,
  '[]'::jsonb
),
(
  '48',
  'Hamburguesa de Pollo',
  'Hamburguesa preparada con pollo y vegetales.',
  'https://loremflickr.com/640/480/chicken,burger?lock=48',
  'Pancita llena, corazón contento',
  70,
  true,
  '[]'::jsonb
),
(
  '49',
  'Sincronizadas (2)',
  'Dos tortillas con jamón y queso fundido.',
  'https://loremflickr.com/640/480/quesadilla,cheese?lock=49',
  'Pancita llena, corazón contento',
  60,
  true,
  '[]'::jsonb
),
(
  '50',
  'Carlota de Limón',
  'Postre frío de limón con base de yogur.',
  'https://loremflickr.com/640/480/lemon,dessert?lock=50',
  'La vida es corta... pide postre',
  36,
  true,
  '[]'::jsonb
),
(
  '51',
  'Cheesecake de Lotus',
  'Cheesecake cremoso con sabor a galleta Lotus.',
  'https://loremflickr.com/640/480/lotus,cheesecake?lock=51',
  'La vida es corta... pide postre',
  45,
  true,
  '[]'::jsonb
),
(
  '52',
  'Tiramisú',
  'Postre cremoso con café, cacao y suave bizcocho.',
  'https://loremflickr.com/640/480/tiramisu,dessert?lock=52',
  'La vida es corta... pide postre',
  45,
  true,
  '[]'::jsonb
),
(
  '53',
  'Gelatina Mosaico',
  'Gelatina cremosa con coloridos cubos de sabores.',
  'https://loremflickr.com/640/480/jelly,dessert?lock=53',
  'La vida es corta... pide postre',
  30,
  true,
  '[]'::jsonb
),
(
  '54',
  'Panqué',
  'Rebanada de panqué suave y esponjoso.',
  'https://loremflickr.com/640/480/pound,cake?lock=54',
  'La vida es corta... pide postre',
  40,
  true,
  '[]'::jsonb
),
(
  '55',
  'Brownie',
  'Brownie de chocolate, suave y chocolatoso.',
  'https://loremflickr.com/640/480/chocolate,brownie?lock=55',
  'La vida es corta... pide postre',
  40,
  true,
  '[]'::jsonb
),
(
  '56',
  'Campechanitas',
  'Crujiente pieza de pan dulce tradicional.',
  'https://loremflickr.com/640/480/pastry,sweet,bread?lock=56',
  'La vida es corta... pide postre',
  30,
  true,
  '[]'::jsonb
),
(
  '57',
  'Maicitos',
  'Snack de maíz preparado para botanear.',
  'https://loremflickr.com/640/480/corn,snack?lock=57',
  'Snacks',
  25,
  true,
  '[]'::jsonb
),
(
  '58',
  'Tostitos Locos',
  'Tostitos preparados con diferentes toppings.',
  'https://loremflickr.com/640/480/nachos,chips?lock=58',
  'Snacks',
  50,
  true,
  '[]'::jsonb
),
(
  '59',
  'Platanitos',
  'Crujientes chips preparados con plátano.',
  'https://loremflickr.com/640/480/banana,chips?lock=59',
  'Snacks',
  35,
  true,
  '[]'::jsonb
),
(
  '60',
  'Obleas',
  'Obleas ligeras y crujientes para un antojo dulce.',
  'https://loremflickr.com/640/480/wafer,dessert?lock=60',
  'Snacks',
  25,
  true,
  '[]'::jsonb
),
(
  '61',
  'Jugo Verde',
  'Jugo fresco preparado con frutas y vegetales.',
  'https://loremflickr.com/640/480/green,juice?lock=61',
  'Mi lado fit',
  45,
  true,
  '[]'::jsonb
),
(
  '62',
  'Ensalada',
  'Ensalada fresca con ingredientes ligeros.',
  'https://loremflickr.com/640/480/healthy,salad?lock=62',
  'Mi lado fit',
  65,
  true,
  '[]'::jsonb
),
(
  '63',
  'Vaso de Fruta con Yogur',
  'Fruta fresca acompañada con yogur cremoso.',
  'https://loremflickr.com/640/480/fruit,yogurt?lock=63',
  'Mi lado fit',
  60,
  true,
  '[]'::jsonb
),
(
  '64',
  'Uvas Congeladas',
  'Uvas frías y refrescantes listas para disfrutar.',
  'https://loremflickr.com/640/480/frozen,grapes?lock=64',
  'Mi lado fit',
  30,
  true,
  '[]'::jsonb
),
(
  '65',
  'Shake de Proteína',
  'Shake cremoso con proteína y sabor a elegir.',
  'https://loremflickr.com/640/480/protein,shake?lock=65',
  'Hoy sí voy al gym',
  90,
  true,
  '[{"id":"flavor","name":"Sabor","type":"single","required":true,"options":[{"id":"berries","name":"Frutos rojos","extraPrice":0},{"id":"cacao","name":"Cacao","extraPrice":0},{"id":"strawberry","name":"Fresa","extraPrice":0}]},{"id":"milk","name":"Tipo de leche","type":"single","required":true,"options":[{"id":"regular","name":"Regular","extraPrice":0},{"id":"almond","name":"Almendras","extraPrice":12},{"id":"rice","name":"Arroz","extraPrice":12}]}]'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image = excluded.image,
  category = excluded.category,
  base_price = excluded.base_price,
  available = excluded.available,
  customizations = excluded.customizations,
  updated_at = now();

commit;
