import type { Story } from "@/types/story";

/**
 * The built-in library. Each page's text and tags drive its 3D picture (see lib/scene3d/director.ts):
 * name the hero ("a fox named Nino"), and use words for the time of day, places and actions.
 * Every page has a "find it" challenge, and every story ends with a short quiz.
 */
export const STORIES: Story[] = [
  {
    id: "nino-forest-of-light",
    title: { en: "Nino and the Forest of Light", es: "Nino y el Bosque de Luz" },
    sticker: "🦊",
    color: "#f5893a",
    theme: "forest",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "forest",
        sceneTags: ["forest", "fox", "trees"],
        sentences: [
          { en: "Once there was a little fox named Nino.", es: "Había una vez un zorrito llamado Nino." },
          { en: "Nino loved to explore the green forest.", es: "A Nino le encantaba explorar el bosque verde." },
        ],
        find: { target: "fox", prompt: { en: "Find Nino the fox!", es: "¡Encuentra a Nino el zorro!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "forest",
        sceneTags: ["forest", "morning", "light"],
        sentences: [
          { en: "One morning, Nino saw a tiny golden light.", es: "Una mañana, Nino vio una lucecita dorada." },
          { en: "It danced between the tall, tall trees.", es: "Bailaba entre los árboles altos, altos." },
        ],
        find: { target: "wisp", prompt: { en: "Tap the little golden light!", es: "¡Toca la lucecita dorada!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "forest",
        sceneTags: ["forest", "fox", "mushrooms"],
        sentences: [
          { en: "\"Follow me!\" said the little light with a giggle.", es: "\"¡Sígueme!\" dijo la lucecita con una risita." },
          { en: "Nino hopped and skipped after it happily.", es: "Nino saltó y brincó tras ella muy feliz." },
        ],
        find: { target: "mushroom", prompt: { en: "Tap a spotty mushroom!", es: "¡Toca un hongo con puntos!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "forest",
        sceneTags: ["forest", "owl", "deer"],
        sentences: [
          { en: "They ran past sleepy owls and a curious deer.", es: "Pasaron corriendo junto a búhos dormilones y un ciervo curioso." },
          { en: "Everyone waved hello to Nino the fox.", es: "Todos saludaron a Nino el zorro." },
        ],
        find: { target: "owl", prompt: { en: "Find a sleepy owl!", es: "¡Encuentra un búho dormilón!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "forest",
        sceneTags: ["forest", "night", "pond"],
        sentences: [
          { en: "At night, the light led Nino to a hidden pond.", es: "De noche, la luz llevó a Nino a un estanque escondido." },
          { en: "A thousand fireflies twinkled all around it.", es: "Mil luciérnagas brillaban a su alrededor." },
        ],
        find: { target: "pond", prompt: { en: "Tap the hidden pond!", es: "¡Toca el estanque escondido!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "forest",
        sceneTags: ["forest", "night", "stars"],
        sentences: [
          { en: "Nino made a wish under the stars.", es: "Nino pidió un deseo bajo las estrellas." },
          { en: "Then he trotted home, happy and warm.", es: "Luego trotó a casa, feliz y calentito." },
        ],
        find: { target: "shootingStar", prompt: { en: "Tap the shooting star!", es: "¡Toca la estrella fugaz!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What color was the little light?", es: "¿De qué color era la lucecita?" },
        choices: [
          { emoji: "💛", label: { en: "Golden", es: "Dorada" } },
          { emoji: "💙", label: { en: "Blue", es: "Azul" } },
          { emoji: "💚", label: { en: "Green", es: "Verde" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "Who was sleepy?", es: "¿Quién tenía sueño?" },
        choices: [
          { emoji: "🐻", label: { en: "A bear", es: "Un oso" } },
          { emoji: "🦉", label: { en: "The owls", es: "Los búhos" } },
          { emoji: "🐟", label: { en: "A fish", es: "Un pez" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "Where did the light lead Nino?", es: "¿A dónde llevó la luz a Nino?" },
        choices: [
          { emoji: "🏰", label: { en: "A castle", es: "Un castillo" } },
          { emoji: "🚀", label: { en: "The moon", es: "La luna" } },
          { emoji: "🏞️", label: { en: "A hidden pond", es: "Un estanque escondido" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "rosie-the-rocket",
    title: { en: "Rosie the Rocket", es: "Rosie el Cohete" },
    sticker: "🚀",
    color: "#6a5acd",
    theme: "space",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "space",
        sceneTags: ["space", "rocket", "stars"],
        sentences: [
          { en: "Once there was a little rocket named Rosie.", es: "Había una vez un cohetito llamado Rosie." },
          { en: "Rosie loved to fly up, up, up!", es: "¡A Rosie le encantaba volar arriba, arriba, arriba!" },
        ],
        find: { target: "rocket", prompt: { en: "Find Rosie the rocket!", es: "¡Encuentra a Rosie el cohete!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "space",
        sceneTags: ["space", "planets", "sprite"],
        sentences: [
          { en: "Zoom! Rosie flew past a big planet with a shiny ring.", es: "¡Zum! Rosie pasó volando junto a un planeta grande con un anillo brillante." },
          { en: "A tiny star sprite waved hello.", es: "Un duendecillo estrella la saludó." },
        ],
        find: { target: "planet", prompt: { en: "Tap a planet!", es: "¡Toca un planeta!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "space",
        sceneTags: ["space", "moon", "treasure"],
        sentences: [
          { en: "Rosie landed on the moon. Bump, bump, bump!", es: "Rosie aterrizó en la luna. ¡Bum, bum, bum!" },
          { en: "She found a treasure chest full of shiny gems!", es: "¡Encontró un cofre del tesoro lleno de gemas brillantes!" },
        ],
        find: { target: "treasure", prompt: { en: "Tap the treasure chest!", es: "¡Toca el cofre del tesoro!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "space",
        sceneTags: ["space", "whale"],
        sentences: [
          { en: "A giant space whale swam by, singing a slow song.", es: "Una ballena espacial gigante pasó nadando, cantando una canción lenta." },
          { en: "\"Hello, Rosie!\" she sang.", es: "\"¡Hola, Rosie!\" cantó." },
        ],
        find: { target: "whale", prompt: { en: "Find the space whale!", es: "¡Encuentra la ballena espacial!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "space",
        sceneTags: ["space", "wish", "comet"],
        sentences: [
          { en: "Rosie and her friends made a wish on a comet.", es: "Rosie y sus amigos pidieron un deseo a un cometa." },
          { en: "Whoosh! It zipped across the sky.", es: "¡Zas! Cruzó el cielo volando." },
        ],
        find: { target: "shootingStar", prompt: { en: "Tap the comet!", es: "¡Toca el cometa!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "night",
        sceneTags: ["night", "rocket", "home"],
        sentences: [
          { en: "Then Rosie zoomed back home to Earth.", es: "Luego Rosie regresó volando a casa, a la Tierra." },
          { en: "Goodnight, Rosie. Goodnight, moon!", es: "Buenas noches, Rosie. ¡Buenas noches, luna!" },
        ],
        find: { target: "moon", prompt: { en: "Tap the moon to say goodnight!", es: "¡Toca la luna para decir buenas noches!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What is Rosie?", es: "¿Qué es Rosie?" },
        choices: [
          { emoji: "🚗", label: { en: "A car", es: "Un carro" } },
          { emoji: "🚀", label: { en: "A rocket", es: "Un cohete" } },
          { emoji: "🚂", label: { en: "A train", es: "Un tren" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "What did Rosie find on the moon?", es: "¿Qué encontró Rosie en la luna?" },
        choices: [
          { emoji: "💎", label: { en: "A treasure chest", es: "Un cofre del tesoro" } },
          { emoji: "🍕", label: { en: "A pizza", es: "Una pizza" } },
          { emoji: "🐶", label: { en: "A puppy", es: "Un perrito" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "Who sang a slow song?", es: "¿Quién cantó una canción lenta?" },
        choices: [
          { emoji: "🦉", label: { en: "An owl", es: "Un búho" } },
          { emoji: "🐶", label: { en: "A puppy", es: "Un perrito" } },
          { emoji: "🐋", label: { en: "A space whale", es: "Una ballena espacial" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "coral-the-sea-turtle",
    title: { en: "Coral the Sea Turtle", es: "Coral la Tortuga Marina" },
    sticker: "🐢",
    color: "#0a8fb8",
    theme: "ocean",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "ocean",
        sceneTags: ["ocean", "turtle"],
        sentences: [
          { en: "Deep in the blue sea lived a little turtle named Coral.", es: "En lo profundo del mar azul vivía una tortuguita llamada Coral." },
        ],
        find: { target: "turtle", prompt: { en: "Find Coral the turtle!", es: "¡Encuentra a Coral la tortuga!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "ocean",
        sceneTags: ["ocean", "fish"],
        sentences: [
          { en: "Coral swam with a group of bright orange fish.", es: "Coral nadaba con un grupo de peces anaranjados y brillantes." },
          { en: "Swish, swish went their tails!", es: "¡Chas, chas hacían sus colas!" },
        ],
        find: { target: "fish", prompt: { en: "Tap an orange fish!", es: "¡Toca un pez anaranjado!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "ocean",
        sceneTags: ["ocean", "whale", "coral"],
        sentences: [
          { en: "Splash! A big blue whale waved hello.", es: "¡Splash! Una gran ballena azul saludó." },
          { en: "\"Want to play?\" asked the whale.", es: "\"¿Quieres jugar?\" preguntó la ballena." },
        ],
        find: { target: "whale", prompt: { en: "Find the big blue whale!", es: "¡Encuentra la gran ballena azul!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "ocean",
        sceneTags: ["ocean", "treasure", "sand"],
        sentences: [
          { en: "Under the sand, Coral found a treasure chest full of gold!", es: "¡Bajo la arena, Coral encontró un cofre lleno de oro!" },
        ],
        find: { target: "treasure", prompt: { en: "Tap the treasure!", es: "¡Toca el tesoro!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "ocean",
        sceneTags: ["ocean", "night", "fish"],
        sentences: [
          { en: "At night, the whole sea began to sparkle.", es: "De noche, todo el mar empezó a brillar." },
          { en: "The fish danced in the glowing water.", es: "Los peces bailaron en el agua brillante." },
        ],
        find: { target: "seaweed", prompt: { en: "Tap the wavy seaweed!", es: "¡Toca las algas onduladas!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "ocean",
        sceneTags: ["ocean", "sunset", "lighthouse"],
        sentences: [
          { en: "At sunset, Coral swam to the beach.", es: "Al atardecer, Coral nadó hasta la playa." },
          { en: "The lighthouse blinked: goodnight, Coral!", es: "El faro parpadeó: ¡buenas noches, Coral!" },
        ],
        find: { target: "lighthouse", prompt: { en: "Tap the lighthouse!", es: "¡Toca el faro!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What animal is Coral?", es: "¿Qué animal es Coral?" },
        choices: [
          { emoji: "🐢", label: { en: "A turtle", es: "Una tortuga" } },
          { emoji: "🐱", label: { en: "A kitten", es: "Un gatito" } },
          { emoji: "🦊", label: { en: "A fox", es: "Un zorro" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "What did Coral find under the sand?", es: "¿Qué encontró Coral bajo la arena?" },
        choices: [
          { emoji: "🍎", label: { en: "An apple", es: "Una manzana" } },
          { emoji: "💰", label: { en: "Treasure", es: "Un tesoro" } },
          { emoji: "🧸", label: { en: "A teddy bear", es: "Un osito" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "Who waved hello?", es: "¿Quién saludó?" },
        choices: [
          { emoji: "🦕", label: { en: "A dinosaur", es: "Un dinosaurio" } },
          { emoji: "🐰", label: { en: "A bunny", es: "Un conejito" } },
          { emoji: "🐋", label: { en: "A whale", es: "Una ballena" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "rex-birthday-party",
    title: { en: "Rex's Birthday Party", es: "La Fiesta de Cumpleaños de Rex" },
    sticker: "🦕",
    color: "#4caf50",
    theme: "dinosaurs",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "dinosaurs",
        sceneTags: ["dinosaur", "jungle", "palm trees"],
        sentences: [
          { en: "In a land of tall palm trees lived a dinosaur named Rex.", es: "En una tierra de palmeras altas vivía un dinosaurio llamado Rex." },
        ],
        find: { target: "dino", prompt: { en: "Find Rex the dinosaur!", es: "¡Encuentra a Rex el dinosaurio!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "dinosaurs",
        sceneTags: ["dinosaur", "morning", "volcano"],
        sentences: [
          { en: "One morning, Rex jumped for joy.", es: "Una mañana, Rex saltó de alegría." },
          { en: "Today was his birthday!", es: "¡Hoy era su cumpleaños!" },
        ],
        find: { target: "volcano", prompt: { en: "Tap the smoky volcano!", es: "¡Toca el volcán humeante!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "dinosaurs",
        sceneTags: ["dinosaur", "bird"],
        sentences: [
          { en: "His friend the little blue bird sang a happy song.", es: "Su amigo el pajarito azul cantó una canción alegre." },
        ],
        find: { target: "bird", prompt: { en: "Find the little blue bird!", es: "¡Encuentra el pajarito azul!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "dinosaurs",
        sceneTags: ["dinosaur", "party", "cake"],
        sentences: [
          { en: "They had a party with a giant cake and balloons!", es: "¡Hicieron una fiesta con un pastel gigante y globos!" },
        ],
        find: { target: "party", prompt: { en: "Tap the birthday cake!", es: "¡Toca el pastel de cumpleaños!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "dinosaurs",
        sceneTags: ["dinosaur", "turtle", "dance"],
        sentences: [
          { en: "A turtle came too, and everyone danced!", es: "¡También vino una tortuga, y todos bailaron!" },
        ],
        find: { target: "tree", prompt: { en: "Tap a palm tree!", es: "¡Toca una palmera!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "dinosaurs",
        sceneTags: ["dinosaur", "sunset"],
        sentences: [
          { en: "At sunset, sleepy Rex gave a big yawn.", es: "Al atardecer, el dormilón Rex dio un gran bostezo." },
          { en: "\"Thank you, friends!\"", es: "\"¡Gracias, amigos!\"" },
        ],
        find: { target: "dino", prompt: { en: "Say goodnight to Rex!", es: "¡Dale las buenas noches a Rex!" } },
      },
    ],
    quiz: [
      {
        question: { en: "Whose birthday was it?", es: "¿De quién era el cumpleaños?" },
        choices: [
          { emoji: "🦊", label: { en: "Nino", es: "Nino" } },
          { emoji: "🦕", label: { en: "Rex", es: "Rex" } },
          { emoji: "🐢", label: { en: "Coral", es: "Coral" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "What was at the party?", es: "¿Qué había en la fiesta?" },
        choices: [
          { emoji: "🎂", label: { en: "A giant cake", es: "Un pastel gigante" } },
          { emoji: "🥕", label: { en: "Carrots", es: "Zanahorias" } },
          { emoji: "⛄", label: { en: "A snowman", es: "Un muñeco de nieve" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "Who sang a happy song?", es: "¿Quién cantó una canción alegre?" },
        choices: [
          { emoji: "🐋", label: { en: "A whale", es: "Una ballena" } },
          { emoji: "🐻", label: { en: "A bear", es: "Un oso" } },
          { emoji: "🐦", label: { en: "A bird", es: "Un pájaro" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "tootle-the-train",
    title: { en: "Tootle the Brave Little Train", es: "Tootle, el Trencito Valiente" },
    sticker: "🚂",
    color: "#ff6b6b",
    theme: "vehicles",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "vehicles",
        sceneTags: ["train", "city"],
        sentences: [
          { en: "Choo choo! Here comes a little train named Tootle.", es: "¡Chu chu! Aquí viene un trencito llamado Tootle." },
        ],
        find: { target: "train", prompt: { en: "Find Tootle the train!", es: "¡Encuentra a Tootle el tren!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "vehicles",
        sceneTags: ["train", "car", "road"],
        sentences: [
          { en: "Tootle raced along with his friend, a red car.", es: "Tootle corría junto a su amigo, un carro rojo." },
          { en: "Beep beep! Toot toot!", es: "¡Bip bip! ¡Tut tut!" },
        ],
        find: { target: "car", prompt: { en: "Tap the red car!", es: "¡Toca el carro rojo!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "vehicles",
        sceneTags: ["train", "rain", "clouds"],
        sentences: [
          { en: "Oh no! Rain began to fall. Drip, drop, drip!", es: "¡Oh, no! Empezó a llover. ¡Plic, plac, plic!" },
        ],
        find: { target: "cloud", prompt: { en: "Tap a rain cloud!", es: "¡Toca una nube de lluvia!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "vehicles",
        sceneTags: ["train", "river", "bridge"],
        sentences: [
          { en: "Brave Tootle rolled over the bridge across the river.", es: "El valiente Tootle cruzó el puente sobre el río." },
        ],
        find: { target: "bridge", prompt: { en: "Tap the bridge!", es: "¡Toca el puente!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "vehicles",
        sceneTags: ["train", "rainbow", "sun"],
        sentences: [
          { en: "The sun came out, and a rainbow filled the sky!", es: "¡Salió el sol y un arcoíris llenó el cielo!" },
        ],
        find: { target: "rainbow", prompt: { en: "Tap the rainbow!", es: "¡Toca el arcoíris!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "vehicles",
        sceneTags: ["train", "city", "street"],
        sentences: [
          { en: "Tootle gave a happy toot. Hooray for Tootle!", es: "Tootle dio un pitido feliz. ¡Hurra por Tootle!" },
        ],
        find: { target: "trafficLight", prompt: { en: "Tap the traffic light!", es: "¡Toca el semáforo!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What is Tootle?", es: "¿Qué es Tootle?" },
        choices: [
          { emoji: "🚂", label: { en: "A train", es: "Un tren" } },
          { emoji: "🚀", label: { en: "A rocket", es: "Un cohete" } },
          { emoji: "🐢", label: { en: "A turtle", es: "Una tortuga" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "What fell from the sky?", es: "¿Qué cayó del cielo?" },
        choices: [
          { emoji: "❄️", label: { en: "Snow", es: "Nieve" } },
          { emoji: "🍭", label: { en: "Candy", es: "Dulces" } },
          { emoji: "🌧️", label: { en: "Rain", es: "Lluvia" } },
        ],
        answerIndex: 2,
      },
      {
        question: { en: "What filled the sky at the end?", es: "¿Qué llenó el cielo al final?" },
        choices: [
          { emoji: "🐉", label: { en: "A dragon", es: "Un dragón" } },
          { emoji: "🌈", label: { en: "A rainbow", es: "Un arcoíris" } },
          { emoji: "🎈", label: { en: "Balloons", es: "Globos" } },
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    id: "stella-rainbow-castle",
    title: { en: "Stella and the Rainbow Castle", es: "Stella y el Castillo Arcoíris" },
    sticker: "🦄",
    color: "#b18cff",
    theme: "magic",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "magic",
        sceneTags: ["magic", "unicorn"],
        sentences: [
          { en: "In a magic land lived a sparkly unicorn named Stella.", es: "En una tierra mágica vivía una unicornio brillante llamada Stella." },
        ],
        find: { target: "unicorn", prompt: { en: "Find Stella the unicorn!", es: "¡Encuentra a Stella la unicornio!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "magic",
        sceneTags: ["magic", "unicorn", "castle"],
        sentences: [
          { en: "Stella trotted to the rainbow castle on the hill.", es: "Stella trotó hasta el castillo arcoíris en la colina." },
        ],
        find: { target: "castle", prompt: { en: "Tap the castle!", es: "¡Toca el castillo!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "magic",
        sceneTags: ["magic", "dragon"],
        sentences: [
          { en: "A little purple dragon peeked out and giggled.", es: "Un dragoncito morado se asomó y soltó una risita." },
        ],
        find: { target: "dragon", prompt: { en: "Find the purple dragon!", es: "¡Encuentra al dragón morado!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "magic",
        sceneTags: ["magic", "cave", "crystals"],
        sentences: [
          { en: "Together they found glowing crystals by a secret cave.", es: "Juntos encontraron cristales brillantes junto a una cueva secreta." },
        ],
        find: { target: "crystal", prompt: { en: "Tap a glowing crystal!", es: "¡Toca un cristal brillante!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "magic",
        sceneTags: ["magic", "party", "cupcakes"],
        sentences: [
          { en: "They had a tea party with cupcakes and sparkles.", es: "Tuvieron una fiesta de té con pastelitos y destellos." },
        ],
        find: { target: "party", prompt: { en: "Tap the party cake!", es: "¡Toca el pastel de la fiesta!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "magic",
        sceneTags: ["magic", "night", "moon"],
        sentences: [
          { en: "Under the moon, Stella fell asleep.", es: "Bajo la luna, Stella se quedó dormida." },
          { en: "The little dragon yawned. Sweet dreams!", es: "El dragoncito bostezó. ¡Dulces sueños!" },
        ],
        find: { target: "moon", prompt: { en: "Tap the moon!", es: "¡Toca la luna!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What is Stella?", es: "¿Qué es Stella?" },
        choices: [
          { emoji: "🐮", label: { en: "A cow", es: "Una vaca" } },
          { emoji: "🦕", label: { en: "A dinosaur", es: "Un dinosaurio" } },
          { emoji: "🦄", label: { en: "A unicorn", es: "Una unicornio" } },
        ],
        answerIndex: 2,
      },
      {
        question: { en: "What color was the dragon?", es: "¿De qué color era el dragón?" },
        choices: [
          { emoji: "💜", label: { en: "Purple", es: "Morado" } },
          { emoji: "🧡", label: { en: "Orange", es: "Anaranjado" } },
          { emoji: "💚", label: { en: "Green", es: "Verde" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "What did they find by the cave?", es: "¿Qué encontraron junto a la cueva?" },
        choices: [
          { emoji: "🍌", label: { en: "Bananas", es: "Plátanos" } },
          { emoji: "💎", label: { en: "Glowing crystals", es: "Cristales brillantes" } },
          { emoji: "🚗", label: { en: "A car", es: "Un carro" } },
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    id: "olive-the-night-owl",
    title: { en: "Olive the Night Owl", es: "Olivia la Lechuza Nocturna" },
    sticker: "🦉",
    color: "#3a4a9c",
    theme: "night",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "night",
        sceneTags: ["night", "owl", "stars"],
        sentences: [
          { en: "When the stars come out, a little owl named Olive opens her eyes.", es: "Cuando salen las estrellas, una lechucita llamada Olivia abre los ojos." },
        ],
        find: { target: "owl", prompt: { en: "Find Olive the owl!", es: "¡Encuentra a Olivia la lechuza!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "night",
        sceneTags: ["night", "owl", "houses"],
        sentences: [
          { en: "Olive flew over the quiet houses.", es: "Olivia voló sobre las casas silenciosas." },
        ],
        find: { target: "house", prompt: { en: "Find the house with glowing windows!", es: "¡Encuentra la casa con ventanas brillantes!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "night",
        sceneTags: ["night", "owl", "moon"],
        sentences: [
          { en: "She waved hello to the big round moon.", es: "Saludó a la gran luna redonda." },
        ],
        find: { target: "moon", prompt: { en: "Tap the big round moon!", es: "¡Toca la gran luna redonda!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "night",
        sceneTags: ["night", "bunny", "pond", "fireflies"],
        sentences: [
          { en: "By the pond, a bunny danced with the fireflies.", es: "Junto al estanque, un conejito bailaba con las luciérnagas." },
        ],
        find: { target: "bunny", prompt: { en: "Find the dancing bunny!", es: "¡Encuentra al conejito que baila!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "night",
        sceneTags: ["night", "bunny", "bed"],
        sentences: [
          { en: "The bunny yawned. Time for bed, little bunny!", es: "El conejito bostezó. ¡A la cama, conejito!" },
        ],
        find: { target: "bed", prompt: { en: "Tap the cozy bed!", es: "¡Toca la camita!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "forest",
        sceneTags: ["forest", "morning", "owl"],
        sentences: [
          { en: "In the morning, sleepy Olive snuggled into her tree.", es: "En la mañana, la dormilona Olivia se acurrucó en su árbol." },
          { en: "Good day, Olive!", es: "¡Buen día, Olivia!" },
        ],
        find: { target: "tree", prompt: { en: "Tap Olive's tree!", es: "¡Toca el árbol de Olivia!" } },
      },
    ],
    quiz: [
      {
        question: { en: "When does Olive wake up?", es: "¿Cuándo se despierta Olivia?" },
        choices: [
          { emoji: "☀️", label: { en: "In the morning", es: "En la mañana" } },
          { emoji: "🌙", label: { en: "At night", es: "De noche" } },
          { emoji: "🍽️", label: { en: "At lunch", es: "A la hora del almuerzo" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "Who did Olive say hello to?", es: "¿A quién saludó Olivia?" },
        choices: [
          { emoji: "🌕", label: { en: "The moon", es: "La luna" } },
          { emoji: "🚗", label: { en: "A car", es: "Un carro" } },
          { emoji: "🐟", label: { en: "A fish", es: "Un pez" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "Where did the bunny sleep?", es: "¿Dónde durmió el conejito?" },
        choices: [
          { emoji: "🚀", label: { en: "In a rocket", es: "En un cohete" } },
          { emoji: "🌳", label: { en: "In a tree", es: "En un árbol" } },
          { emoji: "🛏️", label: { en: "In a bed", es: "En una cama" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "biscuit-farm-day",
    title: { en: "Biscuit's Muddy Farm Day", es: "El Día de Lodo de Biscuit" },
    sticker: "🐶",
    color: "#e0a458",
    theme: "animals",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "animals",
        sceneTags: ["farm", "puppy"],
        sentences: [
          { en: "On a sunny farm lived a happy puppy named Biscuit.", es: "En una granja soleada vivía un perrito feliz llamado Biscuit." },
        ],
        find: { target: "puppy", prompt: { en: "Find Biscuit the puppy!", es: "¡Encuentra a Biscuit el perrito!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "animals",
        sceneTags: ["farm", "puppy", "barn"],
        sentences: [
          { en: "Biscuit ran to the big red barn.", es: "Biscuit corrió hacia el gran granero rojo." },
        ],
        find: { target: "barn", prompt: { en: "Tap the big red barn!", es: "¡Toca el gran granero rojo!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "animals",
        sceneTags: ["farm", "kitten", "butterfly"],
        sentences: [
          { en: "There he met a kitten called Mittens, playing with a butterfly.", es: "Allí conoció a una gatita llamada Mittens, que jugaba con una mariposa." },
        ],
        find: { target: "butterfly", prompt: { en: "Tap the butterfly!", es: "¡Toca la mariposa!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "animals",
        sceneTags: ["farm", "rain", "puddles"],
        sentences: [
          { en: "Splash! It started to rain.", es: "¡Splash! Empezó a llover." },
          { en: "They hopped in the muddy puddles.", es: "Saltaron en los charcos de lodo." },
        ],
        find: { target: "kitten", prompt: { en: "Find Mittens the kitten!", es: "¡Encuentra a Mittens la gatita!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "animals",
        sceneTags: ["farm", "garden", "flowers"],
        sentences: [
          { en: "Then the sun came out over the flower garden.", es: "Luego salió el sol sobre el jardín de flores." },
        ],
        find: { target: "flowerPatch", prompt: { en: "Tap the flower garden!", es: "¡Toca el jardín de flores!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "animals",
        sceneTags: ["farm", "sunset", "hay"],
        sentences: [
          { en: "At sunset, they were sleepy, so they took a nap in the hay.", es: "Al atardecer tenían sueño, así que tomaron una siesta en el heno." },
        ],
        find: { target: "hay", prompt: { en: "Tap a hay bale!", es: "¡Toca un fardo de heno!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What is Biscuit?", es: "¿Qué es Biscuit?" },
        choices: [
          { emoji: "🐱", label: { en: "A kitten", es: "Un gatito" } },
          { emoji: "🐶", label: { en: "A puppy", es: "Un perrito" } },
          { emoji: "🐻", label: { en: "A bear", es: "Un oso" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "What did they hop in?", es: "¿En qué saltaron?" },
        choices: [
          { emoji: "💦", label: { en: "Muddy puddles", es: "Charcos de lodo" } },
          { emoji: "❄️", label: { en: "Snow", es: "Nieve" } },
          { emoji: "🍰", label: { en: "Cake", es: "Pastel" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "Where did they nap?", es: "¿Dónde tomaron la siesta?" },
        choices: [
          { emoji: "🌊", label: { en: "In the sea", es: "En el mar" } },
          { emoji: "🚀", label: { en: "In a rocket", es: "En un cohete" } },
          { emoji: "🌾", label: { en: "In the hay", es: "En el heno" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "bruno-snowy-adventure",
    title: { en: "Bruno's Snowy Adventure", es: "La Aventura Nevada de Bruno" },
    sticker: "🐻",
    color: "#8fa8d8",
    theme: "adventure",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "adventure",
        sceneTags: ["mountains", "bear"],
        sentences: [
          { en: "High in the hills lived a big brown bear named Bruno.", es: "En lo alto de las colinas vivía un gran oso pardo llamado Bruno." },
        ],
        find: { target: "bear", prompt: { en: "Find Bruno the bear!", es: "¡Encuentra a Bruno el oso!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "adventure",
        sceneTags: ["mountains", "snow"],
        sentences: [
          { en: "One morning, soft white snow covered everything!", es: "¡Una mañana, una nieve blanca y suave lo cubrió todo!" },
        ],
        find: { target: "mountain", prompt: { en: "Tap a snowy mountain!", es: "¡Toca una montaña nevada!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "adventure",
        sceneTags: ["snow", "snowman", "bear"],
        sentences: [
          { en: "Bruno rolled three big snowballs and made a snowman.", es: "Bruno hizo rodar tres bolas de nieve y armó un muñeco de nieve." },
        ],
        find: { target: "snowman", prompt: { en: "Tap the snowman!", es: "¡Toca el muñeco de nieve!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "adventure",
        sceneTags: ["snow", "deer"],
        sentences: [
          { en: "A little deer came to play in the snow.", es: "Un cervatillo vino a jugar en la nieve." },
        ],
        find: { target: "deer", prompt: { en: "Find the little deer!", es: "¡Encuentra al cervatillo!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "adventure",
        sceneTags: ["cave", "treasure"],
        sentences: [
          { en: "They followed a trail to a cave with a treasure inside!", es: "¡Siguieron un sendero hasta una cueva con un tesoro adentro!" },
        ],
        find: { target: "treasure", prompt: { en: "Tap the treasure!", es: "¡Toca el tesoro!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "adventure",
        sceneTags: ["sunset", "campfire", "tent"],
        sentences: [
          { en: "At sunset, they sat by a warm campfire.", es: "Al atardecer, se sentaron junto a una fogata calentita." },
          { en: "What a wonderful day!", es: "¡Qué día tan maravilloso!" },
        ],
        find: { target: "campfire", prompt: { en: "Tap the warm campfire!", es: "¡Toca la fogata calentita!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What did Bruno make?", es: "¿Qué hizo Bruno?" },
        choices: [
          { emoji: "🏰", label: { en: "A castle", es: "Un castillo" } },
          { emoji: "⛄", label: { en: "A snowman", es: "Un muñeco de nieve" } },
          { emoji: "🎂", label: { en: "A cake", es: "Un pastel" } },
        ],
        answerIndex: 1,
      },
      {
        question: { en: "Who came to play?", es: "¿Quién vino a jugar?" },
        choices: [
          { emoji: "🦌", label: { en: "A deer", es: "Un cervatillo" } },
          { emoji: "🐋", label: { en: "A whale", es: "Una ballena" } },
          { emoji: "🚗", label: { en: "A car", es: "Un carro" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "Where did they sit at sunset?", es: "¿Dónde se sentaron al atardecer?" },
        choices: [
          { emoji: "🛏️", label: { en: "In bed", es: "En la cama" } },
          { emoji: "🌊", label: { en: "In the sea", es: "En el mar" } },
          { emoji: "🔥", label: { en: "By a campfire", es: "Junto a una fogata" } },
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: "flutter-garden-picnic",
    title: { en: "Flutter's Garden Picnic", es: "El Picnic de Flutter en el Jardín" },
    sticker: "🦋",
    color: "#ff7ac6",
    theme: "garden",
    ageRange: "3-5",
    pages: [
      {
        pageNumber: 1,
        illustrationId: "generic",
        sceneTags: ["meadow", "butterfly"],
        sentences: [
          { en: "In a sunny meadow lived a butterfly named Flutter.", es: "En una pradera soleada vivía una mariposa llamada Flutter." },
        ],
        find: { target: "butterfly", prompt: { en: "Find Flutter the butterfly!", es: "¡Encuentra a Flutter la mariposa!" } },
      },
      {
        pageNumber: 2,
        illustrationId: "generic",
        sceneTags: ["meadow", "garden", "flowers"],
        sentences: [
          { en: "Flutter flew over a garden full of flowers.", es: "Flutter voló sobre un jardín lleno de flores." },
        ],
        find: { target: "flowerPatch", prompt: { en: "Tap the flower garden!", es: "¡Toca el jardín de flores!" } },
      },
      {
        pageNumber: 3,
        illustrationId: "generic",
        sceneTags: ["meadow", "bunny"],
        sentences: [
          { en: "She met a bunny named Hop who loved to jump.", es: "Conoció a un conejito llamado Hop al que le encantaba saltar." },
        ],
        find: { target: "bunny", prompt: { en: "Find Hop the bunny!", es: "¡Encuentra a Hop el conejito!" } },
      },
      {
        pageNumber: 4,
        illustrationId: "generic",
        sceneTags: ["meadow", "bird", "tree"],
        sentences: [
          { en: "A blue bird sang from the top of a tree.", es: "Un pájaro azul cantaba desde lo alto de un árbol." },
        ],
        find: { target: "bird", prompt: { en: "Find the singing bird!", es: "¡Encuentra al pájaro cantor!" } },
      },
      {
        pageNumber: 5,
        illustrationId: "generic",
        sceneTags: ["meadow", "picnic", "cake"],
        sentences: [
          { en: "Everyone had a picnic with cake and berries.", es: "Todos hicieron un picnic con pastel y fresas." },
        ],
        find: { target: "party", prompt: { en: "Tap the picnic cake!", es: "¡Toca el pastel del picnic!" } },
      },
      {
        pageNumber: 6,
        illustrationId: "generic",
        sceneTags: ["meadow", "rainbow", "sun"],
        sentences: [
          { en: "Then a big rainbow smiled over the meadow.", es: "Luego un gran arcoíris sonrió sobre la pradera." },
          { en: "The end!", es: "¡Fin!" },
        ],
        find: { target: "sun", prompt: { en: "Tap the smiling sun!", es: "¡Toca el sol sonriente!" } },
      },
    ],
    quiz: [
      {
        question: { en: "What is Flutter?", es: "¿Qué es Flutter?" },
        choices: [
          { emoji: "🐝", label: { en: "A bee", es: "Una abeja" } },
          { emoji: "🐞", label: { en: "A ladybug", es: "Una mariquita" } },
          { emoji: "🦋", label: { en: "A butterfly", es: "Una mariposa" } },
        ],
        answerIndex: 2,
      },
      {
        question: { en: "Who loved to jump?", es: "¿A quién le encantaba saltar?" },
        choices: [
          { emoji: "🐰", label: { en: "Hop the bunny", es: "Hop el conejito" } },
          { emoji: "🐢", label: { en: "A turtle", es: "Una tortuga" } },
          { emoji: "🐋", label: { en: "A whale", es: "Una ballena" } },
        ],
        answerIndex: 0,
      },
      {
        question: { en: "What was over the meadow at the end?", es: "¿Qué había sobre la pradera al final?" },
        choices: [
          { emoji: "🌙", label: { en: "The moon", es: "La luna" } },
          { emoji: "🌈", label: { en: "A rainbow", es: "Un arcoíris" } },
          { emoji: "🚀", label: { en: "A rocket", es: "Un cohete" } },
        ],
        answerIndex: 1,
      },
    ],
  },
];

export function getStory(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
