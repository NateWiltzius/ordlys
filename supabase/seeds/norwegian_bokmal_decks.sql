DO $seed$
DECLARE
  -- Replace this valid placeholder UUID with the intended Supabase user ID.
  seed_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  noun_deck_id integer;
  verb_deck_id integer;
BEGIN
  IF seed_owner_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
    RAISE EXCEPTION 'Replace seed_owner_id with a real Supabase user ID before running this seed';
  END IF;

  INSERT INTO decks (owner_id, title, description, visibility)
  VALUES (
    seed_owner_id,
    'Norwegian Bokmål: Essential Nouns',
    '300 common Bokmål nouns grouped by practical topic. Articles teach grammatical gender.',
    'public'
  )
  RETURNING id INTO noun_deck_id;

  INSERT INTO lessons (deck_id, title, order_index)
  SELECT noun_deck_id, title, lesson_order
  FROM (VALUES
    ('People and Family', 1),
    ('Home and Everyday Objects', 2),
    ('Food and Drink', 3),
    ('Places and Transport', 4),
    ('Nature and Animals', 5),
    ('Time, Work and Society', 6),
    ('Body and Clothing', 7),
    ('Health and Care', 8),
    ('Technology and Media', 9),
    ('Ideas and Emotions', 10),
    ('Education and Learning', 11),
    ('Business and Money', 12),
    ('Weather and Geography', 13),
    ('Government and Community', 14),
    ('Culture and Recreation', 15)
  ) AS lesson_data(title, lesson_order);

  INSERT INTO vocabs (
    lesson_id, front, back, front_alternatives, back_alternatives, order_index
  )
  SELECT
    lessons.id,
    noun_data.front,
    noun_data.back,
    CASE
      WHEN noun_data.front LIKE 'ei %' THEN ARRAY[
        regexp_replace(noun_data.front, '^ei ', ''),
        regexp_replace(noun_data.front, '^ei ', 'en ')
      ]
      ELSE ARRAY[regexp_replace(noun_data.front, '^(en|et) ', '')]
    END,
    ARRAY[
      CASE
        WHEN noun_data.back ~ '^[aeiou]' THEN 'an ' || noun_data.back
        ELSE 'a ' || noun_data.back
      END
    ],
    noun_data.word_order
  FROM (VALUES
    ('People and Family','en person','person',1),('People and Family','en mann','man',2),
    ('People and Family','ei kvinne','woman',3),('People and Family','et barn','child',4),
    ('People and Family','en gutt','boy',5),('People and Family','ei jente','girl',6),
    ('People and Family','en familie','family',7),('People and Family','ei mor','mother',8),
    ('People and Family','en far','father',9),('People and Family','en sønn','son',10),
    ('People and Family','ei datter','daughter',11),('People and Family','en bror','brother',12),
    ('People and Family','ei søster','sister',13),('People and Family','en bestefar','grandfather',14),
    ('People and Family','ei bestemor','grandmother',15),('People and Family','en venn','friend',16),
    ('People and Family','en nabo','neighbor',17),('People and Family','en kollega','colleague',18),
    ('People and Family','en lærer','teacher',19),('People and Family','en elev','student',20),

    ('Home and Everyday Objects','et hus','house',1),('Home and Everyday Objects','en leilighet','apartment',2),
    ('Home and Everyday Objects','et rom','room',3),('Home and Everyday Objects','et kjøkken','kitchen',4),
    ('Home and Everyday Objects','et bad','bathroom',5),('Home and Everyday Objects','ei dør','door',6),
    ('Home and Everyday Objects','et vindu','window',7),('Home and Everyday Objects','et bord','table',8),
    ('Home and Everyday Objects','en stol','chair',9),('Home and Everyday Objects','ei seng','bed',10),
    ('Home and Everyday Objects','en sofa','sofa',11),('Home and Everyday Objects','ei lampe','lamp',12),
    ('Home and Everyday Objects','en nøkkel','key',13),('Home and Everyday Objects','en telefon','phone',14),
    ('Home and Everyday Objects','ei bok','book',15),('Home and Everyday Objects','en penn','pen',16),
    ('Home and Everyday Objects','en kopp','cup',17),('Home and Everyday Objects','et glass','glass',18),
    ('Home and Everyday Objects','en tallerken','plate',19),('Home and Everyday Objects','en kniv','knife',20),

    ('Food and Drink','et måltid','meal',1),('Food and Drink','en frokost','breakfast',2),
    ('Food and Drink','en lunsj','lunch',3),('Food and Drink','en middag','dinner',4),
    ('Food and Drink','et brød','loaf',5),('Food and Drink','en ost','cheese',6),
    ('Food and Drink','et egg','egg',7),('Food and Drink','en fisk','fish',8),
    ('Food and Drink','et kjøttstykke','piece of meat',9),('Food and Drink','en potet','potato',10),
    ('Food and Drink','en tomat','tomato',11),('Food and Drink','et eple','apple',12),
    ('Food and Drink','en banan','banana',13),('Food and Drink','en appelsin','orange',14),
    ('Food and Drink','ei kake','cake',15),('Food and Drink','en kopp kaffe','cup of coffee',16),
    ('Food and Drink','en kopp te','cup of tea',17),('Food and Drink','ei flaske','bottle',18),
    ('Food and Drink','en restaurant','restaurant',19),('Food and Drink','en meny','menu',20),

    ('Places and Transport','et sted','place',1),('Places and Transport','en by','city',2),
    ('Places and Transport','ei bygd','village',3),('Places and Transport','ei gate','street',4),
    ('Places and Transport','en vei','road',5),('Places and Transport','en butikk','shop',6),
    ('Places and Transport','en skole','school',7),('Places and Transport','et sykehus','hospital',8),
    ('Places and Transport','en stasjon','station',9),('Places and Transport','en flyplass','airport',10),
    ('Places and Transport','en bil','car',11),('Places and Transport','en buss','bus',12),
    ('Places and Transport','et tog','train',13),('Places and Transport','et fly','airplane',14),
    ('Places and Transport','en båt','boat',15),('Places and Transport','en sykkel','bicycle',16),
    ('Places and Transport','en billett','ticket',17),('Places and Transport','ei reise','journey',18),
    ('Places and Transport','et kart','map',19),('Places and Transport','et hotell','hotel',20),

    ('Nature and Animals','et dyr','animal',1),('Nature and Animals','en hund','dog',2),
    ('Nature and Animals','en katt','cat',3),('Nature and Animals','en fugl','bird',4),
    ('Nature and Animals','en hest','horse',5),('Nature and Animals','ei ku','cow',6),
    ('Nature and Animals','en sau','sheep',7),('Nature and Animals','et tre','tree',8),
    ('Nature and Animals','en blomst','flower',9),('Nature and Animals','en skog','forest',10),
    ('Nature and Animals','et fjell','mountain',11),('Nature and Animals','ei elv','river',12),
    ('Nature and Animals','en innsjø','lake',13),('Nature and Animals','et hav','sea',14),
    ('Nature and Animals','ei strand','beach',15),('Nature and Animals','en stein','stone',16),
    ('Nature and Animals','ei sol','sun',17),('Nature and Animals','en måne','moon',18),
    ('Nature and Animals','ei stjerne','star',19),('Nature and Animals','en sky','cloud',20),

    ('Time, Work and Society','en dag','day',1),('Time, Work and Society','ei uke','week',2),
    ('Time, Work and Society','en måned','month',3),('Time, Work and Society','et år','year',4),
    ('Time, Work and Society','en morgen','morning',5),('Time, Work and Society','en kveld','evening',6),
    ('Time, Work and Society','ei natt','night',7),('Time, Work and Society','en time','hour',8),
    ('Time, Work and Society','et minutt','minute',9),('Time, Work and Society','en jobb','job',10),
    ('Time, Work and Society','et kontor','office',11),('Time, Work and Society','et møte','meeting',12),
    ('Time, Work and Society','en pause','break',13),('Time, Work and Society','en lønn','salary',14),
    ('Time, Work and Society','et språk','language',15),('Time, Work and Society','et spørsmål','question',16),
    ('Time, Work and Society','et svar','answer',17),('Time, Work and Society','en idé','idea',18),
    ('Time, Work and Society','et problem','problem',19),('Time, Work and Society','ei løsning','solution',20),

    ('Body and Clothing','et hode','head',1),('Body and Clothing','et ansikt','face',2),
    ('Body and Clothing','et øye','eye',3),('Body and Clothing','et øre','ear',4),
    ('Body and Clothing','en nese','nose',5),('Body and Clothing','en munn','mouth',6),
    ('Body and Clothing','ei tann','tooth',7),('Body and Clothing','en hals','neck',8),
    ('Body and Clothing','ei hånd','hand',9),('Body and Clothing','en arm','arm',10),
    ('Body and Clothing','et bein','leg',11),('Body and Clothing','en fot','foot',12),
    ('Body and Clothing','et hjerte','heart',13),('Body and Clothing','ei skjorte','shirt',14),
    ('Body and Clothing','ei bukse','pair of trousers',15),('Body and Clothing','en kjole','dress',16),
    ('Body and Clothing','ei jakke','jacket',17),('Body and Clothing','en sko','shoe',18),
    ('Body and Clothing','en sokk','sock',19),('Body and Clothing','ei lue','hat',20),

    ('Health and Care','en kropp','body',1),('Health and Care','en lege','doctor',2),
    ('Health and Care','en sykepleier','nurse',3),('Health and Care','en pasient','patient',4),
    ('Health and Care','en sykdom','illness',5),('Health and Care','en skade','injury',6),
    ('Health and Care','en smerte','pain',7),('Health and Care','en feber','fever',8),
    ('Health and Care','en hoste','cough',9),('Health and Care','en medisin','medicine',10),
    ('Health and Care','en tablett','pill',11),('Health and Care','en resept','prescription',12),
    ('Health and Care','en behandling','treatment',13),('Health and Care','en operasjon','operation',14),
    ('Health and Care','en undersøkelse','examination',15),('Health and Care','en avtale','appointment',16),
    ('Health and Care','en ambulanse','ambulance',17),('Health and Care','et apotek','pharmacy',18),
    ('Health and Care','en tannlege','dentist',19),('Health and Care','en fødsel','birth',20),

    ('Technology and Media','en datamaskin','computer',1),('Technology and Media','en skjerm','screen',2),
    ('Technology and Media','et tastatur','keyboard',3),('Technology and Media','ei mus','computer mouse',4),
    ('Technology and Media','et kamera','camera',5),('Technology and Media','et bilde','picture',6),
    ('Technology and Media','en video','video',7),('Technology and Media','en melding','message',8),
    ('Technology and Media','en e-post','email',9),('Technology and Media','et passord','password',10),
    ('Technology and Media','en nettside','website',11),('Technology and Media','en lenke','link',12),
    ('Technology and Media','en fil','file',13),('Technology and Media','et program','program',14),
    ('Technology and Media','en app','app',15),('Technology and Media','et nettverk','network',16),
    ('Technology and Media','ei avis','newspaper',17),('Technology and Media','et magasin','magazine',18),
    ('Technology and Media','en radio','radio',19),('Technology and Media','en kanal','channel',20),

    ('Ideas and Emotions','en tanke','thought',1),('Ideas and Emotions','en mening','opinion',2),
    ('Ideas and Emotions','en grunn','reason',3),('Ideas and Emotions','et valg','choice',4),
    ('Ideas and Emotions','en beslutning','decision',5),('Ideas and Emotions','en plan','plan',6),
    ('Ideas and Emotions','et mål','goal',7),('Ideas and Emotions','en drøm','dream',8),
    ('Ideas and Emotions','et håp','hope',9),('Ideas and Emotions','en følelse','feeling',10),
    ('Ideas and Emotions','ei glede','joy',11),('Ideas and Emotions','en sorg','sorrow',12),
    ('Ideas and Emotions','en frykt','fear',13),('Ideas and Emotions','et sinne','anger',14),
    ('Ideas and Emotions','en kjærlighet','love',15),('Ideas and Emotions','et vennskap','friendship',16),
    ('Ideas and Emotions','en feil','mistake',17),('Ideas and Emotions','en sannhet','truth',18),
    ('Ideas and Emotions','en løgn','lie',19),('Ideas and Emotions','en hemmelighet','secret',20),

    ('Education and Learning','et universitet','university',1),('Education and Learning','en høyskole','college',2),
    ('Education and Learning','et klasserom','classroom',3),('Education and Learning','et fag','subject',4),
    ('Education and Learning','en lekse','homework assignment',5),('Education and Learning','ei oppgave','task',6),
    ('Education and Learning','en prøve','test',7),('Education and Learning','en eksamen','exam',8),
    ('Education and Learning','en karakter','grade',9),('Education and Learning','et kurs','course',10),
    ('Education and Learning','en tekst','text',11),('Education and Learning','et ord','word',12),
    ('Education and Learning','ei setning','sentence',13),('Education and Learning','et eksempel','example',14),
    ('Education and Learning','en regel','rule',15),('Education and Learning','et kapittel','chapter',16),
    ('Education and Learning','et bibliotek','library',17),('Education and Learning','en ordbok','dictionary',18),
    ('Education and Learning','en kunnskap','knowledge',19),('Education and Learning','en utdanning','education',20),

    ('Business and Money','en bedrift','company',1),('Business and Money','en kunde','customer',2),
    ('Business and Money','en sjef','boss',3),('Business and Money','en ansatt','employee',4),
    ('Business and Money','en forretningsavtale','business agreement',5),('Business and Money','en kontrakt','contract',6),
    ('Business and Money','et prosjekt','project',7),('Business and Money','et produkt','product',8),
    ('Business and Money','en tjeneste','service',9),('Business and Money','en pris','price',10),
    ('Business and Money','en kostnad','cost',11),('Business and Money','en inntekt','income',12),
    ('Business and Money','en skatt','tax',13),('Business and Money','en bank','bank',14),
    ('Business and Money','en konto','account',15),('Business and Money','et lån','loan',16),
    ('Business and Money','et budsjett','budget',17),('Business and Money','en faktura','invoice',18),
    ('Business and Money','en kvittering','receipt',19),('Business and Money','en økonomi','economy',20),

    ('Weather and Geography','et uvær','stormy weather',1),('Weather and Geography','en temperatur','temperature',2),
    ('Weather and Geography','en grad','degree',3),('Weather and Geography','en regnbyge','rain shower',4),
    ('Weather and Geography','et snøfall','snowfall',5),('Weather and Geography','en vind','wind',6),
    ('Weather and Geography','et tordenvær','thunderstorm',7),('Weather and Geography','ei tåke','fog',8),
    ('Weather and Geography','en is','ice',9),('Weather and Geography','en dal','valley',10),
    ('Weather and Geography','ei øy','island',11),('Weather and Geography','en kyst','coast',12),
    ('Weather and Geography','en foss','waterfall',13),('Weather and Geography','en fjord','fjord',14),
    ('Weather and Geography','en ås','hill',15),('Weather and Geography','et landskap','landscape',16),
    ('Weather and Geography','et land','country',17),('Weather and Geography','en region','region',18),
    ('Weather and Geography','en grense','border',19),('Weather and Geography','en hovedstad','capital city',20),

    ('Government and Community','en stat','state',1),('Government and Community','ei regjering','government',2),
    ('Government and Community','et storting','parliament',3),('Government and Community','en kommune','municipality',4),
    ('Government and Community','en politiker','politician',5),('Government and Community','et politisk valg','election',6),
    ('Government and Community','ei stemme','vote',7),('Government and Community','en lov','law',8),
    ('Government and Community','en rettighet','right',9),('Government and Community','ei plikt','duty',10),
    ('Government and Community','et politi','police force',11),('Government and Community','en domstol','court',12),
    ('Government and Community','en borger','citizen',13),('Government and Community','et samfunn','society',14),
    ('Government and Community','en organisasjon','organization',15),('Government and Community','en forening','association',16),
    ('Government and Community','en kirke','church',17),('Government and Community','et nabolag','neighborhood',18),
    ('Government and Community','en sikkerhet','security',19),('Government and Community','en frihet','freedom',20),

    ('Culture and Recreation','en film','movie',1),('Culture and Recreation','en serie','series',2),
    ('Culture and Recreation','en sang','song',3),('Culture and Recreation','et instrument','instrument',4),
    ('Culture and Recreation','en konsert','concert',5),('Culture and Recreation','et teater','theater',6),
    ('Culture and Recreation','et museum','museum',7),('Culture and Recreation','en kunst','art',8),
    ('Culture and Recreation','et maleri','painting',9),('Culture and Recreation','et spill','game',10),
    ('Culture and Recreation','en sport','sport',11),('Culture and Recreation','en kamp','match',12),
    ('Culture and Recreation','et lag','team',13),('Culture and Recreation','en spiller','player',14),
    ('Culture and Recreation','en ball','ball',15),('Culture and Recreation','en tur','trip',16),
    ('Culture and Recreation','en ferie','vacation',17),('Culture and Recreation','en fest','party',18),
    ('Culture and Recreation','en gave','gift',19),('Culture and Recreation','en hobby','hobby',20)
  ) AS noun_data(lesson_title, front, back, word_order)
  JOIN lessons
    ON lessons.deck_id = noun_deck_id
   AND lessons.title = noun_data.lesson_title;

  INSERT INTO decks (owner_id, title, description, visibility)
  VALUES (
    seed_owner_id,
    'Norwegian Bokmål: Essential Verbs',
    '300 common Bokmål verbs grouped by practical function.',
    'public'
  )
  RETURNING id INTO verb_deck_id;

  INSERT INTO lessons (deck_id, title, order_index)
  SELECT verb_deck_id, title, lesson_order
  FROM (VALUES
    ('Core and Modal Verbs', 1),
    ('Daily Actions', 2),
    ('Communication and Thought', 3),
    ('Movement and Travel', 4),
    ('Work and Creation', 5),
    ('Change, Senses and Relationships', 6),
    ('Home and Practical Tasks', 7),
    ('Social Life and Emotions', 8),
    ('Nature and Physical Actions', 9),
    ('Planning and Development', 10),
    ('Body and Health', 11),
    ('Education and Language', 12),
    ('Business and Finance', 13),
    ('Technology and Media', 14),
    ('Rules and Abstract Actions', 15)
  ) AS lesson_data(title, lesson_order);

  INSERT INTO vocabs (
    lesson_id, front, back, front_alternatives, back_alternatives, order_index
  )
  SELECT
    lessons.id,
    verb_data.front,
    verb_data.back,
    ARRAY[regexp_replace(verb_data.front, '^å ', '')],
    ARRAY[regexp_replace(verb_data.back, '^to ', '')],
    verb_data.word_order
  FROM (VALUES
    ('Core and Modal Verbs','å være','to be',1),('Core and Modal Verbs','å ha','to have',2),
    ('Core and Modal Verbs','å gjøre','to do',3),('Core and Modal Verbs','å kunne','to be able',4),
    ('Core and Modal Verbs','å ville','to want',5),('Core and Modal Verbs','å skulle','to be supposed',6),
    ('Core and Modal Verbs','å måtte','to have to',7),('Core and Modal Verbs','å burde','to ought',8),
    ('Core and Modal Verbs','å få','to receive',9),('Core and Modal Verbs','å bli','to become',10),
    ('Core and Modal Verbs','å finnes','to exist',11),('Core and Modal Verbs','å trenge','to need',12),
    ('Core and Modal Verbs','å prøve','to try',13),('Core and Modal Verbs','å begynne','to begin',14),
    ('Core and Modal Verbs','å slutte','to stop',15),('Core and Modal Verbs','å fortsette','to continue',16),
    ('Core and Modal Verbs','å bruke','to use',17),('Core and Modal Verbs','å velge','to choose',18),
    ('Core and Modal Verbs','å klare','to manage',19),('Core and Modal Verbs','å bety','to mean',20),

    ('Daily Actions','å våkne','to wake up',1),('Daily Actions','å stå opp','to get up',2),
    ('Daily Actions','å vaske','to wash',3),('Daily Actions','å kle på seg','to get dressed',4),
    ('Daily Actions','å spise','to eat',5),('Daily Actions','å drikke','to drink',6),
    ('Daily Actions','å lage mat','to cook',7),('Daily Actions','å rydde','to tidy',8),
    ('Daily Actions','å rengjøre','to clean',9),('Daily Actions','å åpne','to open',10),
    ('Daily Actions','å lukke','to close',11),('Daily Actions','å sitte','to sit',12),
    ('Daily Actions','å stå','to stand',13),('Daily Actions','å ligge','to lie',14),
    ('Daily Actions','å sove','to sleep',15),('Daily Actions','å hvile','to rest',16),
    ('Daily Actions','å kjøpe','to buy',17),('Daily Actions','å betale','to pay',18),
    ('Daily Actions','å koste','to cost',19),('Daily Actions','å vente','to wait',20),

    ('Communication and Thought','å si','to say',1),('Communication and Thought','å snakke','to speak',2),
    ('Communication and Thought','å fortelle','to tell',3),('Communication and Thought','å spørre','to ask',4),
    ('Communication and Thought','å svare','to answer',5),('Communication and Thought','å høre','to hear',6),
    ('Communication and Thought','å lytte','to listen',7),('Communication and Thought','å lese','to read',8),
    ('Communication and Thought','å skrive','to write',9),('Communication and Thought','å forklare','to explain',10),
    ('Communication and Thought','å forstå','to understand',11),('Communication and Thought','å vite','to know',12),
    ('Communication and Thought','å kjenne','to know personally',13),('Communication and Thought','å tenke','to think',14),
    ('Communication and Thought','å tro','to believe',15),('Communication and Thought','å huske','to remember',16),
    ('Communication and Thought','å glemme','to forget',17),('Communication and Thought','å lære','to learn',18),
    ('Communication and Thought','å studere','to study',19),('Communication and Thought','å oversette','to translate',20),

    ('Movement and Travel','å gå','to walk',1),('Movement and Travel','å komme','to come',2),
    ('Movement and Travel','å dra','to leave',3),('Movement and Travel','å reise','to travel',4),
    ('Movement and Travel','å kjøre','to drive',5),('Movement and Travel','å sykle','to cycle',6),
    ('Movement and Travel','å fly','to fly',7),('Movement and Travel','å svømme','to swim',8),
    ('Movement and Travel','å løpe','to run',9),('Movement and Travel','å hoppe','to jump',10),
    ('Movement and Travel','å følge','to follow',11),('Movement and Travel','å møte','to meet',12),
    ('Movement and Travel','å besøke','to visit',13),('Movement and Travel','å ankomme','to arrive',14),
    ('Movement and Travel','å returnere','to return',15),('Movement and Travel','å snu','to turn around',16),
    ('Movement and Travel','å stoppe','to stop',17),('Movement and Travel','å bære','to carry',18),
    ('Movement and Travel','å hente','to fetch',19),('Movement and Travel','å levere','to deliver',20),

    ('Work and Creation','å arbeide','to work',1),('Work and Creation','å lage','to make',2),
    ('Work and Creation','å bygge','to build',3),('Work and Creation','å skape','to create',4),
    ('Work and Creation','å tegne','to draw',5),('Work and Creation','å male','to paint',6),
    ('Work and Creation','å spille','to play',7),('Work and Creation','å synge','to sing',8),
    ('Work and Creation','å danse','to dance',9),('Work and Creation','å planlegge','to plan',10),
    ('Work and Creation','å bestemme','to decide',11),('Work and Creation','å organisere','to organize',12),
    ('Work and Creation','å hjelpe','to help',13),('Work and Creation','å reparere','to repair',14),
    ('Work and Creation','å sende','to send',15),('Work and Creation','å motta','to receive',16),
    ('Work and Creation','å selge','to sell',17),('Work and Creation','å låne','to borrow',18),
    ('Work and Creation','å spare','to save',19),('Work and Creation','å tjene','to earn',20),

    ('Change, Senses and Relationships','å se','to see',1),('Change, Senses and Relationships','å se på','to watch',2),
    ('Change, Senses and Relationships','å lukte','to smell',3),('Change, Senses and Relationships','å smake','to taste',4),
    ('Change, Senses and Relationships','å føle','to feel',5),('Change, Senses and Relationships','å like','to like',6),
    ('Change, Senses and Relationships','å elske','to love',7),('Change, Senses and Relationships','å hate','to hate',8),
    ('Change, Senses and Relationships','å ønske','to wish',9),('Change, Senses and Relationships','å savne','to miss',10),
    ('Change, Senses and Relationships','å bo','to live',11),('Change, Senses and Relationships','å leve','to be alive',12),
    ('Change, Senses and Relationships','å dø','to die',13),('Change, Senses and Relationships','å vokse','to grow',14),
    ('Change, Senses and Relationships','å endre','to change',15),('Change, Senses and Relationships','å flytte','to move',16),
    ('Change, Senses and Relationships','å miste','to lose',17),('Change, Senses and Relationships','å finne','to find',18),
    ('Change, Senses and Relationships','å gi','to give',19),('Change, Senses and Relationships','å ta','to take',20),

    ('Home and Practical Tasks','å eie','to own',1),('Home and Practical Tasks','å flytte inn','to move in',2),
    ('Home and Practical Tasks','å flytte ut','to move out',3),('Home and Practical Tasks','å låse','to lock',4),
    ('Home and Practical Tasks','å låse opp','to unlock',5),('Home and Practical Tasks','å slå på','to turn on',6),
    ('Home and Practical Tasks','å slå av','to turn off',7),('Home and Practical Tasks','å fylle','to fill',8),
    ('Home and Practical Tasks','å tømme','to empty',9),('Home and Practical Tasks','å kutte','to cut',10),
    ('Home and Practical Tasks','å steke','to fry',11),('Home and Practical Tasks','å koke','to boil',12),
    ('Home and Practical Tasks','å bake','to bake',13),('Home and Practical Tasks','å dekke','to cover',14),
    ('Home and Practical Tasks','å pakke','to pack',15),('Home and Practical Tasks','å henge','to hang',16),
    ('Home and Practical Tasks','å tørke','to dry',17),('Home and Practical Tasks','å kaste','to throw away',18),
    ('Home and Practical Tasks','å sortere','to sort',19),('Home and Practical Tasks','å måle','to measure',20),

    ('Social Life and Emotions','å hilse','to greet',1),('Social Life and Emotions','å invitere','to invite',2),
    ('Social Life and Emotions','å feire','to celebrate',3),('Social Life and Emotions','å takke','to thank',4),
    ('Social Life and Emotions','å beklage','to apologize',5),('Social Life and Emotions','å love','to promise',6),
    ('Social Life and Emotions','å stole på','to trust',7),('Social Life and Emotions','å støtte','to support',8),
    ('Social Life and Emotions','å dele','to share',9),('Social Life and Emotions','å samarbeide','to cooperate',10),
    ('Social Life and Emotions','å diskutere','to discuss',11),('Social Life and Emotions','å krangle','to argue',12),
    ('Social Life and Emotions','å le','to laugh',13),('Social Life and Emotions','å smile','to smile',14),
    ('Social Life and Emotions','å gråte','to cry',15),('Social Life and Emotions','å bekymre seg','to worry',16),
    ('Social Life and Emotions','å glede seg','to look forward',17),('Social Life and Emotions','å håpe','to hope',18),
    ('Social Life and Emotions','å foretrekke','to prefer',19),('Social Life and Emotions','å respektere','to respect',20),

    ('Nature and Physical Actions','å regne','to rain',1),('Nature and Physical Actions','å snø','to snow',2),
    ('Nature and Physical Actions','å blåse','to blow',3),('Nature and Physical Actions','å skinne','to shine',4),
    ('Nature and Physical Actions','å plante','to plant',5),('Nature and Physical Actions','å plukke','to pick',6),
    ('Nature and Physical Actions','å grave','to dig',7),('Nature and Physical Actions','å klatre','to climb',8),
    ('Nature and Physical Actions','å falle','to fall',9),('Nature and Physical Actions','å løfte','to lift',10),
    ('Nature and Physical Actions','å trekke','to pull',11),('Nature and Physical Actions','å skyve','to push',12),
    ('Nature and Physical Actions','å holde','to hold',13),('Nature and Physical Actions','å slippe','to let go',14),
    ('Nature and Physical Actions','å treffe','to hit',15),('Nature and Physical Actions','å sparke','to kick',16),
    ('Nature and Physical Actions','å berøre','to touch',17),('Nature and Physical Actions','å puste','to breathe',18),
    ('Nature and Physical Actions','å brenne','to burn',19),('Nature and Physical Actions','å fryse','to freeze',20),

    ('Planning and Development','å forberede','to prepare',1),('Planning and Development','å starte','to start',2),
    ('Planning and Development','å fullføre','to complete',3),('Planning and Development','å forbedre','to improve',4),
    ('Planning and Development','å utvikle','to develop',5),('Planning and Development','å redusere','to reduce',6),
    ('Planning and Development','å øke','to increase',7),('Planning and Development','å sammenligne','to compare',8),
    ('Planning and Development','å kontrollere','to check',9),('Planning and Development','å undersøke','to examine',10),
    ('Planning and Development','å oppdage','to discover',11),('Planning and Development','å løse','to solve',12),
    ('Planning and Development','å endre seg','to change oneself',13),('Planning and Development','å forbedre seg','to improve oneself',14),
    ('Planning and Development','å søke','to apply',15),('Planning and Development','å godta','to accept',16),
    ('Planning and Development','å nekte','to refuse',17),('Planning and Development','å tillate','to allow',18),
    ('Planning and Development','å kreve','to require',19),('Planning and Development','å oppnå','to achieve',20),

    ('Body and Health','å spise opp','to finish eating',1),('Body and Health','å drikke opp','to finish drinking',2),
    ('Body and Health','å våkne opp','to wake up fully',3),('Body and Health','å sovne','to fall asleep',4),
    ('Body and Health','å hoste','to cough',5),('Body and Health','å nyse','to sneeze',6),
    ('Body and Health','å blø','to bleed',7),('Body and Health','å skade','to injure',8),
    ('Body and Health','å helbrede','to heal',9),('Body and Health','å behandle','to treat',10),
    ('Body and Health','å bli undersøkt','to be examined',11),('Body and Health','å operere','to operate',12),
    ('Body and Health','å trene','to exercise',13),('Body and Health','å veie','to weigh',14),
    ('Body and Health','å strekke','to stretch',15),('Body and Health','å slappe av','to relax',16),
    ('Body and Health','å kle av seg','to get undressed',17),('Body and Health','å barbere seg','to shave',18),
    ('Body and Health','å dusje','to shower',19),('Body and Health','å pusse','to brush',20),

    ('Education and Language','å undervise','to teach',1),('Education and Language','å øve','to practice',2),
    ('Education and Language','å gjenta','to repeat',3),('Education and Language','å uttale','to pronounce',4),
    ('Education and Language','å stave','to spell',5),('Education and Language','å beskrive','to describe',6),
    ('Education and Language','å definere','to define',7),('Education and Language','å nevne','to mention',8),
    ('Education and Language','å uttrykke','to express',9),('Education and Language','å presentere','to present',10),
    ('Education and Language','å notere','to note',11),('Education and Language','å kopiere','to copy',12),
    ('Education and Language','å rette','to correct',13),('Education and Language','å bestå','to pass',14),
    ('Education and Language','å stryke','to fail',15),('Education and Language','å pugge','to memorize',16),
    ('Education and Language','å analysere','to analyze',17),('Education and Language','å oppsummere','to summarize',18),
    ('Education and Language','å diskutere med','to discuss with',19),('Education and Language','å tolke','to interpret',20),

    ('Business and Finance','å ansette','to hire',1),('Business and Finance','å si opp','to resign',2),
    ('Business and Finance','å avskjedige','to dismiss',3),('Business and Finance','å lede','to lead',4),
    ('Business and Finance','å produsere','to produce',5),('Business and Finance','å tilby','to offer',6),
    ('Business and Finance','å bestille','to order',7),('Business and Finance','å reservere','to reserve',8),
    ('Business and Finance','å investere','to invest',9),('Business and Finance','å finansiere','to finance',10),
    ('Business and Finance','å skylde','to owe',11),('Business and Finance','å betale tilbake','to repay',12),
    ('Business and Finance','å forhandle','to negotiate',13),('Business and Finance','å signere','to sign',14),
    ('Business and Finance','å avtale','to arrange',15),('Business and Finance','å rapportere','to report',16),
    ('Business and Finance','å registrere','to register',17),('Business and Finance','å konkurrere','to compete',18),
    ('Business and Finance','å markedsføre','to market',19),('Business and Finance','å importere','to import',20),

    ('Technology and Media','å ringe','to call',1),('Technology and Media','å fotografere','to photograph',2),
    ('Technology and Media','å filme','to film',3),('Technology and Media','å laste ned','to download',4),
    ('Technology and Media','å laste opp','to upload',5),('Technology and Media','å lagre','to save digitally',6),
    ('Technology and Media','å slette','to delete',7),('Technology and Media','å installere','to install',8),
    ('Technology and Media','å oppdatere','to update',9),('Technology and Media','å koble','to connect',10),
    ('Technology and Media','å søke etter','to search for',11),('Technology and Media','å klikke','to click',12),
    ('Technology and Media','å trykke','to press',13),('Technology and Media','å publisere','to publish',14),
    ('Technology and Media','å strømme','to stream',15),('Technology and Media','å abonnere','to subscribe',16),
    ('Technology and Media','å dele på nettet','to share online',17),('Technology and Media','å programmere','to program',18),
    ('Technology and Media','å logge inn','to log in',19),('Technology and Media','å logge ut','to log out',20),

    ('Rules and Abstract Actions','å tillate seg','to permit oneself',1),('Rules and Abstract Actions','å forby','to forbid',2),
    ('Rules and Abstract Actions','å følge en regel','to follow a rule',3),('Rules and Abstract Actions','å bryte','to break',4),
    ('Rules and Abstract Actions','å beskytte','to protect',5),('Rules and Abstract Actions','å forsvare','to defend',6),
    ('Rules and Abstract Actions','å angripe','to attack',7),('Rules and Abstract Actions','å vinne','to win',8),
    ('Rules and Abstract Actions','å tape','to lose a contest',9),('Rules and Abstract Actions','å lykkes','to succeed',10),
    ('Rules and Abstract Actions','å mislykkes','to fail',11),('Rules and Abstract Actions','å påvirke','to influence',12),
    ('Rules and Abstract Actions','å avhenge','to depend',13),('Rules and Abstract Actions','å inneholde','to contain',14),
    ('Rules and Abstract Actions','å inkludere','to include',15),('Rules and Abstract Actions','å erstatte','to replace',16),
    ('Rules and Abstract Actions','å unngå','to avoid',17),('Rules and Abstract Actions','å hindre','to prevent',18),
    ('Rules and Abstract Actions','å foreslå','to suggest',19),('Rules and Abstract Actions','å anbefale','to recommend',20)
  ) AS verb_data(lesson_title, front, back, word_order)
  JOIN lessons
    ON lessons.deck_id = verb_deck_id
   AND lessons.title = verb_data.lesson_title;
END
$seed$;
