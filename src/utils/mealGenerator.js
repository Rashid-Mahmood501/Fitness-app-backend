const mealStoreModel = require("../models/mealStore.model");

// const ingredients = {
//   protein: [
//     {
//       name: "Chicken Breast",
//       calories: 165,
//       protein: 31,
//       fat: 3.6,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
//     },
//     {
//       name: "Turkey Breast",
//       calories: 135,
//       protein: 29,
//       fat: 1,
//       carbs: 0,
//       image:
//         "https://plus.unsplash.com/premium_photo-1664391682453-546426dba581?q=80&w=3424&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     },
//     {
//       name: "Salmon",
//       calories: 208,
//       protein: 20,
//       fat: 13,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Tuna (canned)",
//       calories: 132,
//       protein: 28,
//       fat: 1.3,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
//     },
//     {
//       name: "Eggs",
//       calories: 155,
//       protein: 13,
//       fat: 11,
//       carbs: 1.1,
//       image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc",
//     },
//     {
//       name: "Greek Yogurt",
//       calories: 59,
//       protein: 10,
//       fat: 0.4,
//       carbs: 3.6,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJrZxpl8uGkjD-2yaGT7jsfHJHJ0S82mtA0A&s",
//     },
//     {
//       name: "Cottage Cheese",
//       calories: 98,
//       protein: 11,
//       fat: 4.3,
//       carbs: 3.4,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Cottagecheese200px.jpg/1200px-Cottagecheese200px.jpg",
//     },
//     {
//       name: "Tofu",
//       calories: 76,
//       protein: 8,
//       fat: 4.8,
//       carbs: 1.9,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXYGxHZ-FF6Hx3cAySOTbgGixBYb5592_TZQ&s",
//     },
//     {
//       name: "Tempeh",
//       calories: 193,
//       protein: 20,
//       fat: 11,
//       carbs: 9,
//       image:
//         "https://static01.nyt.com/images/2024/09/27/multimedia/sticky-spicy-tempehrex-zqvm/sticky-spicy-tempehrex-zqvm-threeByTwoMediumAt2X-v2.jpg",
//     },
//     {
//       name: "Beef (lean)",
//       calories: 250,
//       protein: 26,
//       fat: 15,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
//     },
//     {
//       name: "Pork Loin",
//       calories: 242,
//       protein: 27,
//       fat: 14,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
//     },
//     {
//       name: "Shrimp",
//       calories: 99,
//       protein: 24,
//       fat: 0.3,
//       carbs: 0.2,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Lentils",
//       calories: 116,
//       protein: 9,
//       fat: 0.4,
//       carbs: 20,
//       image:
//         "https://www.lemonblossoms.com/wp-content/uploads/2021/03/How-To-Cook-Lentils-S1.jpg",
//     },
//     {
//       name: "Black Beans",
//       calories: 132,
//       protein: 9,
//       fat: 0.5,
//       carbs: 23,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTxTv9eKSAPSckOuxlTR4_1Na97ApGboSEmw&s",
//     },
//     {
//       name: "Edamame",
//       calories: 121,
//       protein: 11,
//       fat: 5,
//       carbs: 9,
//       image:
//         "https://reciperunner.com/wp-content/uploads/2019/09/Asian-Edamame-Salad-Picture.jpg",
//     },
//     {
//       name: "Quinoa",
//       calories: 120,
//       protein: 4.1,
//       fat: 1.9,
//       carbs: 21,
//       image:
//         "https://www.allrecipes.com/thmb/qAywXhsLSx1XGNgoc8Y62kjX5RE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/216999simple-savory-quinoaFranceC-398611140dcf4e829a55fdfa967bdec6.jpg",
//     },
//     {
//       name: "Seitan",
//       calories: 120,
//       protein: 25,
//       fat: 2,
//       carbs: 2,
//       image:
//         "https://veggiesociety.com/wp-content/uploads/2024/04/easy-seitan.jpeg",
//     },
//     {
//       name: "Chickpeas",
//       calories: 164,
//       protein: 9,
//       fat: 2.6,
//       carbs: 27,
//       image:
//         "https://www.allrecipes.com/thmb/WdQzwYsrWX0-6zRprlfn7OitWN8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/81548-roasted-chickpeas-ddmfs-0442-1x2-hero-295c03efec90435a8588848f7e50f0bf.jpg",
//     },
//     {
//       name: "Protein Powder",
//       calories: 120,
//       protein: 24,
//       fat: 1,
//       carbs: 3,
//       image:
//         "https://assets.clevelandclinic.org/transform/5912d44c-c4c7-4ca3-bc65-c4597780a614/Brown-Rice-Protein-Powder-1062901980-770x533-1_jpg",
//     },
//     {
//       name: "Milk (low-fat)",
//       calories: 103,
//       protein: 8,
//       fat: 2.4,
//       carbs: 12,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/004-soymilk.jpg/960px-004-soymilk.jpg",
//     },
//     {
//       name: "Duck Breast",
//       calories: 337,
//       protein: 27,
//       fat: 28,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
//     },
//     {
//       name: "Anchovies",
//       calories: 210,
//       protein: 29,
//       fat: 10,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Venison",
//       calories: 158,
//       protein: 30,
//       fat: 3.2,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791",
//     },
//     {
//       name: "Lamb",
//       calories: 294,
//       protein: 25,
//       fat: 21,
//       carbs: 0,
//       image:
//         "https://images.getrecipekit.com/v1615995124_RedRubbedBabyLambChopsPg101_xyzuwo.jpg?aspect_ratio=16:9&quality=90&",
//     },
//     {
//       name: "Halibut",
//       calories: 140,
//       protein: 27,
//       fat: 3,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Mackerel",
//       calories: 205,
//       protein: 19,
//       fat: 13.9,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Swordfish",
//       calories: 144,
//       protein: 24,
//       fat: 5,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Scallops",
//       calories: 111,
//       protein: 20,
//       fat: 1,
//       carbs: 5,
//       image:
//         "https://carlsbadcravings.com/wp-content/uploads/2025/02/pan-seared-scallops-6.jpg",
//     },
//     {
//       name: "Octopus",
//       calories: 82,
//       protein: 14.9,
//       fat: 1,
//       carbs: 2.2,
//       image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
//     },
//     {
//       name: "Soy Milk",
//       calories: 100,
//       protein: 7,
//       fat: 4,
//       carbs: 4,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/004-soymilk.jpg/960px-004-soymilk.jpg",
//     },
//   ],

//   fat: [
//     {
//       name: "Avocado",
//       calories: 160,
//       protein: 2,
//       fat: 15,
//       carbs: 9,
//       image:
//         "https://cdn.britannica.com/72/170772-050-D52BF8C2/Avocado-fruits.jpg",
//     },
//     {
//       name: "Olive Oil",
//       calories: 119,
//       protein: 0,
//       fat: 14,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
//     },
//     {
//       name: "Almonds",
//       calories: 164,
//       protein: 6,
//       fat: 14,
//       carbs: 6,
//       image:
//         "https://images.immediate.co.uk/production/volatile/sites/30/2021/02/almonds-9e25ce7.jpg?quality=90&resize=556,505",
//     },
//     {
//       name: "Peanuts",
//       calories: 161,
//       protein: 7,
//       fat: 14,
//       carbs: 6,
//       image:
//         "https://i0.wp.com/afrovitalityeats.com/wp-content/uploads/2018/04/Roasted-Crunchy-sallted-peanuts.jpg?resize=1200%2C900&ssl=1",
//     },
//     {
//       name: "Chia Seeds",
//       calories: 137,
//       protein: 4,
//       fat: 9,
//       carbs: 12,
//       image:
//         "https://organicbazar.net/cdn/shop/products/Chia-Seeds.jpg?v=1694168295",
//     },
//     {
//       name: "Flaxseeds",
//       calories: 150,
//       protein: 5,
//       fat: 12,
//       carbs: 8,
//       image:
//         "https://media.post.rvohealth.io/wp-content/uploads/2017/04/flax-seeds-732x549-thumbnail.jpg",
//     },
//     {
//       name: "Walnuts",
//       calories: 185,
//       protein: 4,
//       fat: 18,
//       carbs: 4,
//       image:
//         "https://hunzafoodways.com/wp-content/uploads/2020/03/Fotolia_46501692_M.jpg",
//     },
//     {
//       name: "Cashews",
//       calories: 157,
//       protein: 5,
//       fat: 12,
//       carbs: 9,
//       image:
//         "https://assets.clevelandclinic.org/files/45821c82-8ea8-51da-9d26-c10c29c6fcdc?response_content_disposition=inline&version=a0b1ec4b&account_id=8C5B7274-CF0D-447F-8E6A3FA7B9C4132B&signature=Hr0amrogsuvTQHMhYinRPpudNF5ktPxqMpTYSp5urui2piDTwhY7ikzRcMGghNqcTyzq8Y%2BRFO3vJYhXi5SbDg%3D%3D&expiry=1750550400000",
//     },
//     {
//       name: "Sunflower Seeds",
//       calories: 164,
//       protein: 6,
//       fat: 14,
//       carbs: 6,
//       image:
//         "https://static-01.daraz.pk/p/1b045bb0e1b7a402fefde2bf7d4609c6.jpg",
//     },
//     {
//       name: "Pumpkin Seeds",
//       calories: 151,
//       protein: 7,
//       fat: 13,
//       carbs: 5,
//       image:
//         "https://www.heart.org/-/media/Images/News/2018/October-2018/1016PumpkinSeeds_SC.jpg?sc_lang=en&hash=4C3D736881742D6B40D56C1433DA1417",
//     },
//     {
//       name: "Coconut Oil",
//       calories: 117,
//       protein: 0,
//       fat: 14,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
//     },
//     {
//       name: "Butter",
//       calories: 102,
//       protein: 0.1,
//       fat: 11.5,
//       carbs: 0,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/d/d3/%C5%A0v%C3%A9dsk%C3%BD_kol%C3%A1%C4%8D_naruby_904_%28cropped%29.JPG",
//     },
//     {
//       name: "Cheddar Cheese",
//       calories: 113,
//       protein: 7,
//       fat: 9.4,
//       carbs: 0.4,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/d/d3/%C5%A0v%C3%A9dsk%C3%BD_kol%C3%A1%C4%8D_naruby_904_%28cropped%29.JPG",
//     },
//     {
//       name: "Parmesan",
//       calories: 122,
//       protein: 10,
//       fat: 8,
//       carbs: 1,
//       image:
//         "https://cheesemaking.com/cdn/shop/products/parmesan-style-cheese-making-recipe-565200.jpg?v=1744671599&width=1200",
//     },
//     {
//       name: "Cream Cheese",
//       calories: 99,
//       protein: 2,
//       fat: 10,
//       carbs: 1,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/d/d3/%C5%A0v%C3%A9dsk%C3%BD_kol%C3%A1%C4%8D_naruby_904_%28cropped%29.JPG",
//     },
//     {
//       name: "Heavy Cream",
//       calories: 103,
//       protein: 0.9,
//       fat: 11,
//       carbs: 0.8,
//       image:
//         "https://assets.epicurious.com/photos/627c0b78dbdfbaaa75a5af8b/4:3/w_5461,h_4096,c_limit/CoconutWhippedCream_HERO_110519_5803.jpg",
//     },
//     {
//       name: "Tahini",
//       calories: 89,
//       protein: 2.6,
//       fat: 8,
//       carbs: 3,
//       image:
//         "https://i2.wp.com/www.downshiftology.com/wp-content/uploads/2017/10/Tahini-main.jpg",
//     },
//     {
//       name: "Mayonnaise",
//       calories: 94,
//       protein: 0,
//       fat: 10,
//       carbs: 0,
//       image:
//         "https://i2.wp.com/www.downshiftology.com/wp-content/uploads/2023/05/Mayonnaise-Recipe-11.jpg",
//     },
//     {
//       name: "Dark Chocolate",
//       calories: 170,
//       protein: 2,
//       fat: 12,
//       carbs: 13,
//       image:
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Green_and_Black%27s_dark_chocolate_bar_2.jpg/1200px-Green_and_Black%27s_dark_chocolate_bar_2.jpg",
//     },
//     {
//       name: "Hazelnuts",
//       calories: 178,
//       protein: 4.2,
//       fat: 17,
//       carbs: 4.7,
//       image:
//         "https://cdn.shopify.com/s/files/1/0437/8953/files/Hazelnuts.png?v=1652477908",
//     },
//     {
//       name: "Macadamia Nuts",
//       calories: 204,
//       protein: 2.2,
//       fat: 21,
//       carbs: 4,
//       image:
//         "https://tazafresh.pk/wp-content/uploads/2023/01/macadamia-nuts-with-shell6.jpg",
//     },
//     {
//       name: "Brazil Nuts",
//       calories: 186,
//       protein: 4,
//       fat: 19,
//       carbs: 3,
//       image:
//         "https://cdn-prod.medicalnewstoday.com/content/images/articles/325/325000/brazil-nuts-in-a-bowl.jpg",
//     },
//     {
//       name: "Pecans",
//       calories: 196,
//       protein: 2.5,
//       fat: 20,
//       carbs: 4,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkXL3gM1eNM-gqXohSIN6o4HzqrKXSRL2DMw&s",
//     },
//     {
//       name: "Pine Nuts",
//       calories: 191,
//       protein: 3.9,
//       fat: 19,
//       carbs: 3.7,
//       image:
//         "https://theheirloompantry.co/wp-content/uploads/2023/03/how-to-toast-pine-nuts-pinoli-on-the-stovetop-or-oven-the-heirloom-pantry-3-500x500.jpg",
//     },
//     {
//       name: "Goat Cheese",
//       calories: 75,
//       protein: 5,
//       fat: 6,
//       carbs: 0,
//       image:
//         "https://www.thespruceeats.com/thmb/mX-F3neACkE1fhVc0MJj1zv2iM0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/homemade-goat-cheese-with-lemon-juice-591553_15-5c40f7cbc9e77c0001f70d1d.jpg",
//     },
//     {
//       name: "Lard",
//       calories: 115,
//       protein: 0,
//       fat: 13,
//       carbs: 0,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTO3dWMM2v6_RYyXXXR4z5yE74ZlEv2mStzgQ&s",
//     },
//     {
//       name: "Duck Fat",
//       calories: 113,
//       protein: 0,
//       fat: 12.8,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
//     },
//     {
//       name: "Sesame Oil",
//       calories: 120,
//       protein: 0,
//       fat: 14,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
//     },
//     {
//       name: "Ghee",
//       calories: 112,
//       protein: 0,
//       fat: 12.7,
//       carbs: 0,
//       image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
//     },
//     {
//       name: "Coconut Milk",
//       calories: 45,
//       protein: 0.5,
//       fat: 4.8,
//       carbs: 1,
//       image:
//         "https://elavegan.com/wp-content/uploads/2016/08/Homemade-coconut-milk-recipe.jpg",
//     },
//   ],

//   carb: [
//     {
//       name: "Brown Rice",
//       calories: 216,
//       protein: 5,
//       fat: 1.8,
//       carbs: 45,
//       image:
//         "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
//     },
//     {
//       name: "White Rice",
//       calories: 204,
//       protein: 4.2,
//       fat: 0.4,
//       carbs: 44,
//       image:
//         "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
//     },
//     {
//       name: "Quinoa",
//       calories: 120,
//       protein: 4.1,
//       fat: 1.9,
//       carbs: 21,
//       image:
//         "https://www.allrecipes.com/thmb/qAywXhsLSx1XGNgoc8Y62kjX5RE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/216999simple-savory-quinoaFranceC-398611140dcf4e829a55fdfa967bdec6.jpg",
//     },
//     {
//       name: "Sweet Potato",
//       calories: 103,
//       protein: 2,
//       fat: 0.2,
//       carbs: 24,
//       image:
//         "https://images.immediate.co.uk/production/volatile/sites/30/2020/02/Sweet-potatoes-ca0d8f4.jpg?quality=90&resize=556,505",
//     },
//     {
//       name: "Oats",
//       calories: 150,
//       protein: 5,
//       fat: 2.5,
//       carbs: 27,
//       image:
//         "https://nutritionsource.hsph.harvard.edu/wp-content/uploads/2018/03/oats-701299_1920.jpg",
//     },
//     {
//       name: "Whole Wheat Bread",
//       calories: 130,
//       protein: 6,
//       fat: 2,
//       carbs: 24,
//       image:
//         "https://www.allrecipes.com/thmb/_piMRxT9zYHP39Lnz6-lObHzEWw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/AR-6773-simple-whole-wheat-bread-DDMFS-4x3-B-969e7bce922948959cb9e85aa4b2ff0d.jpg",
//     },
//     {
//       name: "Banana",
//       calories: 105,
//       protein: 1.3,
//       fat: 0.3,
//       carbs: 27,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAvJIhKAK0IZw_01WfKOyUHieI5EcVqg9pKQ&s",
//     },
//     {
//       name: "Apple",
//       calories: 95,
//       protein: 0.5,
//       fat: 0.3,
//       carbs: 25,
//       image:
//         "https://assets.clevelandclinic.org/transform/cd71f4bd-81d4-45d8-a450-74df78e4477a/Apples-184940975-770x533-1_jpg",
//     },
//     {
//       name: "Berries",
//       calories: 85,
//       protein: 1,
//       fat: 0.5,
//       carbs: 20,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgCf39wwoC1ULUZvSVpFLcJe_dLk3O_y5S8A&s",
//     },
//     {
//       name: "Carrots",
//       calories: 41,
//       protein: 0.9,
//       fat: 0.2,
//       carbs: 10,
//       image:
//         "https://static01.nyt.com/images/2014/05/22/dining/Carrots-With-Orange-And-Cardamom/Carrots-With-Orange-And-Cardamom-jumbo.jpg",
//     },
//     {
//       name: "Corn",
//       calories: 132,
//       protein: 5,
//       fat: 1.5,
//       carbs: 29,
//       image:
//         "https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_1:1/k%2FPhoto%2FRecipes%2F2024-05-grilled-corn%2Fgrilled-corn-605_9964be-rotated",
//     },
//     {
//       name: "Peas",
//       calories: 118,
//       protein: 8,
//       fat: 0.6,
//       carbs: 21,
//       image:
//         "https://d14iv1hjmfkv57.cloudfront.net/assets/recipes/peas-pancetta/_600x600_crop_center-center_61_line/159-web-horizon.jpg",
//     },
//     {
//       name: "Lentils",
//       calories: 116,
//       protein: 9,
//       fat: 0.4,
//       carbs: 20,
//       image:
//         "https://www.lemonblossoms.com/wp-content/uploads/2021/03/How-To-Cook-Lentils-S1.jpg",
//     },
//     {
//       name: "Chickpeas",
//       calories: 164,
//       protein: 9,
//       fat: 2.6,
//       carbs: 27,
//       image:
//         "https://www.allrecipes.com/thmb/WdQzwYsrWX0-6zRprlfn7OitWN8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/81548-roasted-chickpeas-ddmfs-0442-1x2-hero-295c03efec90435a8588848f7e50f0bf.jpg",
//     },
//     {
//       name: "Potatoes",
//       calories: 161,
//       protein: 4.3,
//       fat: 0.2,
//       carbs: 37,
//       image:
//         "https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_4:3/k%2FPhoto%2FRecipes%2F2020-10-Crispy-Skillet-Fried-Potatoes%2Fkitchn-crispy-skillet-fried-potatoes-2",
//     },
//     {
//       name: "Pasta (whole wheat)",
//       calories: 174,
//       protein: 7.5,
//       fat: 0.9,
//       carbs: 37,
//       image:
//         "https://d27p2a3djqwgnt.cloudfront.net/wp-content/uploads/2020/10/20101443/feature.web_-1.jpg",
//     },
//     {
//       name: "White Bread",
//       calories: 79,
//       protein: 2.6,
//       fat: 1,
//       carbs: 15,
//       image:
//         "https://merryboosters.com/wp-content/uploads/2020/05/blog-featured-image.png",
//     },
//     {
//       name: "Tortilla (flour)",
//       calories: 140,
//       protein: 4,
//       fat: 4,
//       carbs: 22,
//       image:
//         "https://static01.nyt.com/images/2024/08/06/multimedia/11EATrex-flour-tortillas-mvfk/11EATrex-flour-tortillas-mvfk-mediumSquareAt3X.jpg",
//     },
//     {
//       name: "Dates",
//       calories: 66,
//       protein: 0.4,
//       fat: 0.1,
//       carbs: 18,
//       image:
//         "https://i0.wp.com/post.healthline.com/wp-content/uploads/2019/11/medjool-dates-1296x728-header-1296x728.jpg?w=1155&h=1528",
//     },
//     {
//       name: "Honey",
//       calories: 64,
//       protein: 0,
//       fat: 0,
//       carbs: 17,
//       image:
//         "https://static-01.daraz.pk/p/cb488286cc2ee0565e2d51d018c190ce.jpg",
//     },
//     {
//       name: "Maple Syrup",
//       calories: 52,
//       protein: 0,
//       fat: 0,
//       carbs: 13,
//       image:
//         "https://www.veganfriendly.org.uk/wp-content/uploads/2020/07/maple-syrup.jpg",
//     },
//     {
//       name: "Grapes",
//       calories: 104,
//       protein: 1.1,
//       fat: 0.2,
//       carbs: 27,
//       image:
//         "https://www.thespruceeats.com/thmb/l1_lV7wgpqRArWBwpG3jzHih_e8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/what-are-grapes-5193263-hero-01-80564d77b6534aa8bfc34f378556e513.jpg",
//     },
//     {
//       name: "Mango",
//       calories: 99,
//       protein: 1.4,
//       fat: 0.6,
//       carbs: 25,
//       image:
//         "https://i0.wp.com/plant.pk/wp-content/uploads/2023/11/1000233211.jpg?fit=554%2C554&ssl=1",
//     },
//     {
//       name: "Pineapple",
//       calories: 82,
//       protein: 1,
//       fat: 0.2,
//       carbs: 22,
//       image:
//         "https://5aday.co.nz/assets/site/fruit-and-vegetables/_articleHero/Pineapple.jpg",
//     },
//     {
//       name: "Raisins",
//       calories: 129,
//       protein: 1.3,
//       fat: 0.2,
//       carbs: 34,
//       image: "https://cdn.britannica.com/57/131157-050-34C34151/raisins.jpg",
//     },
//     {
//       name: "Couscous",
//       calories: 176,
//       protein: 6,
//       fat: 0.3,
//       carbs: 36,
//       image:
//         "https://www.inspiredtaste.net/wp-content/uploads/2017/12/Easy-Couscous-Salad-Recipe-1-1200.jpg",
//     },
//     {
//       name: "Bagel",
//       calories: 245,
//       protein: 9,
//       fat: 1.5,
//       carbs: 48,
//       image:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJdt9YSgHH-JlDz3gHlph1g8DUD3ATGBd-KA&s",
//     },
//     {
//       name: "Granola",
//       calories: 200,
//       protein: 4,
//       fat: 7,
//       carbs: 32,
//       image:
//         "https://cookieandkate.com/images/2015/10/best-granola-recipe-1.jpg",
//     },
//     {
//       name: "Barley",
//       calories: 193,
//       protein: 3.5,
//       fat: 0.7,
//       carbs: 44,
//       image: "https://goodness-farm.com/wp-content/uploads/2023/04/barley.jpg",
//     },
//     {
//       name: "Pita Bread",
//       calories: 170,
//       protein: 5.5,
//       fat: 1,
//       carbs: 33,
//       image:
//         "https://www.allrecipes.com/thmb/tShCpIiFi89ynAS01zTOFqiyRHI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/AR-232719-homemade-pita-bread-DDMFS-2x1-beauty-f1bac2a781c54032a12236de959e1146.jpg",
//     },
//   ],
// };

// function shuffleArray(arr) {
//   return arr.sort(() => 0.5 - Math.random());
// }

// function getClosestIngredients(ingredients, target, macroType, count = 10) {
//   const sorted = [...ingredients].sort(
//     (a, b) => Math.abs(a[macroType] - target) - Math.abs(b[macroType] - target)
//   );
//   return shuffleArray(sorted.slice(0, count));
// }

function calculateMacroScore(meal, targetCalories, targetProtein, targetFat, targetCarbs) {
  const caloriesDiff = Math.abs(meal.calories - targetCalories);
  const proteinDiff = Math.abs(meal.protein - targetProtein);
  const fatDiff = Math.abs(meal.fat - targetFat);
  const carbsDiff = Math.abs(meal.carbs - targetCarbs);
  
  // Weighted scoring - calories have higher weight
  return (caloriesDiff * 0.4) + (proteinDiff * 0.2) + (fatDiff * 0.2) + (carbsDiff * 0.2);
}

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function generateMealsFromDB(macros, mealsPerDay = 4) {
  const portionCalories = macros.totalCalories / mealsPerDay;
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  const suggestedMeals = {};

  const targetProtein = macros.protein / mealsPerDay;
  const targetFat = macros.fat / mealsPerDay;
  const targetCarbs = macros.carbs / mealsPerDay;

  for (const type of mealTypes) {
    try {
      const dbMeals = await mealStoreModel.find({ type }).lean();
      
      let selectedMeals = [];
      
      if (dbMeals.length > 0) {
        const mealsWithScores = dbMeals.map(meal => ({
          ...meal,
          score: calculateMacroScore(meal, portionCalories, targetProtein, targetFat, targetCarbs)
        }));
        
        const sortedMeals = mealsWithScores.sort((a, b) => a.score - b.score);
        
        const bestMatches = sortedMeals.slice(0, Math.min(10, sortedMeals.length));
        
        const shuffledBest = shuffleArray(bestMatches);
        selectedMeals = shuffledBest.slice(0, 3).map(meal => {
          const { score, ...mealWithoutScore } = meal;
          return mealWithoutScore;
        });
      } else {
        console.log(`No meals found for type: ${type}, fetching first 3 meals from each meal type`);
        
        // Get first 3 meals from each meal type when no matches found
        const fallbackMeals = {};
        for (const fallbackType of mealTypes) {
          const typeMeals = await mealStoreModel.find({ type: fallbackType }).limit(3).lean();
          if (typeMeals.length > 0) {
            fallbackMeals[fallbackType] = typeMeals;
          }
        }
        
        // Combine all fallback meals into a single array
        selectedMeals = Object.values(fallbackMeals).flat();
        
        // If we still don't have enough meals, limit to what we have
        if (selectedMeals.length > 0) {
          selectedMeals = selectedMeals.slice(0, 3);
        }
      }
      
      // If still no meals found, create placeholder meals
      if (selectedMeals.length === 0) {
        selectedMeals = [{
          _id: null,
          name: `No ${type} meals available`,
          type: type,
          calories: Math.round(portionCalories),
          protein: Math.round(targetProtein),
          fat: Math.round(targetFat),
          carbs: Math.round(targetCarbs),
          image: null,
          message: "Please add meals to the database for better suggestions"
        }];
      }
      
      // Ensure we have exactly 3 meals by duplicating if necessary
      while (selectedMeals.length < 3 && selectedMeals.length > 0) {
        selectedMeals.push(selectedMeals[selectedMeals.length - 1]);
      }
      
      suggestedMeals[type] = selectedMeals.slice(0, 3);
      
    } catch (error) {
      console.error(`Error fetching meals for type ${type}:`, error);
      suggestedMeals[type] = [{
        _id: null,
        name: `Error loading ${type} meals`,
        type: type,
        calories: Math.round(portionCalories),
        protein: Math.round(targetProtein),
        fat: Math.round(targetFat),
        carbs: Math.round(targetCarbs),
        image: null,
        error: "Database error occurred"
      }];
    }
  }

  return suggestedMeals;
}

// async function generateMeals(macros, mealsPerDay = 4) {
//   const portionCalories = macros.totalCalories / mealsPerDay;
//   const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
//   const suggestedMeals = {};

//   for (const type of mealTypes) {
//     const proteinTarget = (portionCalories * 0.3) / 4;
//     const fatTarget = (portionCalories * 0.3) / 9;
//     const carbTarget = (portionCalories * 0.4) / 4;

//     const proteins = getClosestIngredients(
//       ingredients.protein,
//       proteinTarget,
//       "protein",
//       10
//     );
//     const fats = getClosestIngredients(ingredients.fat, fatTarget, "fat", 10);
//     const carbs = getClosestIngredients(
//       ingredients.carb,
//       carbTarget,
//       "carbs",
//       10
//     );

//     const mealOptions = [];
//     for (let i = 0; i < 1; i++) {
//       const mealIngredients = [
//         proteins[i % proteins.length],
//         proteins[(i + 1) % proteins.length],
//         fats[i % fats.length],
//         fats[(i + 1) % fats.length],
//         carbs[i % carbs.length],
//       ];

//       const calories = mealIngredients.reduce(
//         (sum, ing) => sum + ing.calories,
//         0
//       );
//       const protein = mealIngredients.reduce(
//         (sum, ing) => sum + ing.protein,
//         0
//       );
//       const fat = mealIngredients.reduce((sum, ing) => sum + ing.fat, 0);
//       const carbsTotal = mealIngredients.reduce(
//         (sum, ing) => sum + ing.carbs,
//         0
//       );

//       mealOptions.push({
//         type,
//         ingredients: mealIngredients,
//         calories,
//         protein,
//         fat,
//         carbs: carbsTotal,
//       });
//     }

//     suggestedMeals[type] = mealOptions;
//   }

//   return suggestedMeals;
// }

module.exports = {
  generateMealsFromDB,
};
