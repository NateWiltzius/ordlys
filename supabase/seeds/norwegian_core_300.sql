DO $seed$
DECLARE
  -- Replace this placeholder with the intended Supabase user ID.
  seed_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  core_deck_id integer;
  seeded_vocab_count integer;
BEGIN
  IF seed_owner_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
    RAISE EXCEPTION 'Replace seed_owner_id with a real Supabase user ID before running this seed';
  END IF;

  SELECT id
  INTO core_deck_id
  FROM decks
  WHERE owner_id = seed_owner_id
    AND title = 'Norwegian Core 300'
  LIMIT 1;

  IF core_deck_id IS NOT NULL THEN
    RAISE NOTICE 'Norwegian Core 300 already exists with deck id %. Seed skipped.', core_deck_id;
  ELSE
    INSERT INTO decks (owner_id, title, description, visibility)
    VALUES (
      seed_owner_id,
      'Norwegian Core 300',
      'Practical everyday Bokmål vocabulary for beginners living in Norway.',
      'public'
    )
    RETURNING id INTO core_deck_id;

    INSERT INTO lessons (deck_id, title, order_index)
    SELECT core_deck_id, title, lesson_order
    FROM (VALUES
      ('First Words & Survival', 0),
      ('Pronouns & People', 1),
      ('Essential Verbs I', 2),
      ('Questions & Basic Conversation', 3),
      ('Food & Drink', 4),
      ('Home & Apartment', 5),
      ('Numbers, Time & Days', 6),
      ('Places Around Town', 7),
      ('Transport & Directions', 8),
      ('Useful Adjectives', 9),
      ('Shopping & Money', 10),
      ('Work, Study & Appointments', 11),
      ('Weather & Nature', 12),
      ('Health, Body & Feelings', 13),
      ('Everyday Connectors & Phrases', 14)
    ) AS lesson_data(title, lesson_order);

    INSERT INTO vocabs (
      lesson_id,
      front,
      back,
      front_alternatives,
      back_alternatives,
      reading,
      order_index
    )
    SELECT
      lessons.id,
      vocab_data.front,
      vocab_data.back,
      (
        CASE
          WHEN vocab_data.front LIKE 'ei %'
            THEN ARRAY[regexp_replace(vocab_data.front, '^ei ', 'en ')]
          ELSE ARRAY[]::text[]
        END
        ||
        CASE
          WHEN right(vocab_data.front, 1) = '?'
            THEN ARRAY[rtrim(vocab_data.front, '?')]
          ELSE ARRAY[]::text[]
        END
      )::varchar[],
      CASE
        WHEN vocab_data.back LIKE '% / %'
          THEN regexp_split_to_array(vocab_data.back, ' / ')::varchar[]
        ELSE ARRAY[]::varchar[]
      END,
      NULL,
      vocab_data.word_order
    FROM (VALUES
      ('First Words & Survival', 'hei', 'hello', 0),
      ('First Words & Survival', 'god morgen', 'good morning', 1),
      ('First Words & Survival', 'god kveld', 'good evening', 2),
      ('First Words & Survival', 'ha det', 'goodbye', 3),
      ('First Words & Survival', 'takk', 'thank you', 4),
      ('First Words & Survival', 'tusen takk', 'thank you very much', 5),
      ('First Words & Survival', 'vær så snill', 'please', 6),
      ('First Words & Survival', 'unnskyld', 'excuse me', 7),
      ('First Words & Survival', 'beklager', 'sorry', 8),
      ('First Words & Survival', 'ja', 'yes', 9),
      ('First Words & Survival', 'nei', 'no', 10),
      ('First Words & Survival', 'kanskje', 'maybe', 11),
      ('First Words & Survival', 'hjelp', 'help', 12),
      ('First Words & Survival', 'å forstå', 'to understand', 13),
      ('First Words & Survival', 'å snakke', 'to speak', 14),
      ('First Words & Survival', 'norsk', 'Norwegian', 15),
      ('First Words & Survival', 'engelsk', 'English', 16),
      ('First Words & Survival', 'sakte', 'slowly', 17),
      ('First Words & Survival', 'igjen', 'again', 18),
      ('First Words & Survival', 'jeg vet ikke', 'I do not know', 19),

      ('Pronouns & People', 'jeg', 'I', 0),
      ('Pronouns & People', 'du', 'you', 1),
      ('Pronouns & People', 'han', 'he', 2),
      ('Pronouns & People', 'hun', 'she', 3),
      ('Pronouns & People', 'den', 'it / that', 4),
      ('Pronouns & People', 'det', 'it / that', 5),
      ('Pronouns & People', 'vi', 'we', 6),
      ('Pronouns & People', 'dere', 'you (plural)', 7),
      ('Pronouns & People', 'de', 'they', 8),
      ('Pronouns & People', 'en person', 'a person', 9),
      ('Pronouns & People', 'en mann', 'a man', 10),
      ('Pronouns & People', 'ei kvinne', 'a woman', 11),
      ('Pronouns & People', 'et barn', 'a child', 12),
      ('Pronouns & People', 'en venn', 'a friend', 13),
      ('Pronouns & People', 'en nabo', 'a neighbor', 14),
      ('Pronouns & People', 'en familie', 'a family', 15),
      ('Pronouns & People', 'et navn', 'a name', 16),
      ('Pronouns & People', 'folk', 'people', 17),
      ('Pronouns & People', 'alle', 'everyone / all', 18),
      ('Pronouns & People', 'noen', 'someone / some', 19),

      ('Essential Verbs I', 'å være', 'to be', 0),
      ('Essential Verbs I', 'å ha', 'to have', 1),
      ('Essential Verbs I', 'å gjøre', 'to do', 2),
      ('Essential Verbs I', 'å gå', 'to go / walk', 3),
      ('Essential Verbs I', 'å komme', 'to come', 4),
      ('Essential Verbs I', 'å bo', 'to live / reside', 5),
      ('Essential Verbs I', 'å hete', 'to be called', 6),
      ('Essential Verbs I', 'å ville', 'to want', 7),
      ('Essential Verbs I', 'å kunne', 'to be able to', 8),
      ('Essential Verbs I', 'å måtte', 'to have to', 9),
      ('Essential Verbs I', 'å trenge', 'to need', 10),
      ('Essential Verbs I', 'å vite', 'to know', 11),
      ('Essential Verbs I', 'å si', 'to say', 12),
      ('Essential Verbs I', 'å se', 'to see', 13),
      ('Essential Verbs I', 'å høre', 'to hear', 14),
      ('Essential Verbs I', 'å finne', 'to find', 15),
      ('Essential Verbs I', 'å gi', 'to give', 16),
      ('Essential Verbs I', 'å ta', 'to take', 17),
      ('Essential Verbs I', 'å få', 'to get / receive', 18),
      ('Essential Verbs I', 'å bruke', 'to use', 19),

      ('Questions & Basic Conversation', 'hva', 'what', 0),
      ('Questions & Basic Conversation', 'hvem', 'who', 1),
      ('Questions & Basic Conversation', 'hvor', 'where', 2),
      ('Questions & Basic Conversation', 'når', 'when', 3),
      ('Questions & Basic Conversation', 'hvorfor', 'why', 4),
      ('Questions & Basic Conversation', 'hvordan', 'how', 5),
      ('Questions & Basic Conversation', 'hvilken', 'which (common gender)', 6),
      ('Questions & Basic Conversation', 'hvilket', 'which (neuter)', 7),
      ('Questions & Basic Conversation', 'hvilke', 'which (plural)', 8),
      ('Questions & Basic Conversation', 'hvor mye', 'how much', 9),
      ('Questions & Basic Conversation', 'hvor mange', 'how many', 10),
      ('Questions & Basic Conversation', 'kan du hjelpe meg?', 'can you help me?', 11),
      ('Questions & Basic Conversation', 'snakker du engelsk?', 'do you speak English?', 12),
      ('Questions & Basic Conversation', 'hva betyr det?', 'what does that mean?', 13),
      ('Questions & Basic Conversation', 'hvordan går det?', 'how are you?', 14),
      ('Questions & Basic Conversation', 'det går bra', 'I am doing well', 15),
      ('Questions & Basic Conversation', 'jeg forstår', 'I understand', 16),
      ('Questions & Basic Conversation', 'jeg forstår ikke', 'I do not understand', 17),
      ('Questions & Basic Conversation', 'kan du gjenta?', 'can you repeat?', 18),
      ('Questions & Basic Conversation', 'hvor er ...?', 'where is ...?', 19),

      ('Food & Drink', 'mat', 'food', 0),
      ('Food & Drink', 'vann', 'water', 1),
      ('Food & Drink', 'en kaffe', 'a coffee', 2),
      ('Food & Drink', 'te', 'tea', 3),
      ('Food & Drink', 'melk', 'milk', 4),
      ('Food & Drink', 'et brød', 'a loaf of bread', 5),
      ('Food & Drink', 'en ost', 'a cheese', 6),
      ('Food & Drink', 'et egg', 'an egg', 7),
      ('Food & Drink', 'en fisk', 'a fish', 8),
      ('Food & Drink', 'en kylling', 'a chicken', 9),
      ('Food & Drink', 'kjøtt', 'meat', 10),
      ('Food & Drink', 'ris', 'rice', 11),
      ('Food & Drink', 'en potet', 'a potato', 12),
      ('Food & Drink', 'en grønnsak', 'a vegetable', 13),
      ('Food & Drink', 'frukt', 'fruit', 14),
      ('Food & Drink', 'et eple', 'an apple', 15),
      ('Food & Drink', 'en frokost', 'a breakfast', 16),
      ('Food & Drink', 'en lunsj', 'a lunch', 17),
      ('Food & Drink', 'en middag', 'a dinner', 18),
      ('Food & Drink', 'å spise', 'to eat', 19),

      ('Home & Apartment', 'et hjem', 'a home', 0),
      ('Home & Apartment', 'et hus', 'a house', 1),
      ('Home & Apartment', 'en leilighet', 'an apartment', 2),
      ('Home & Apartment', 'et rom', 'a room', 3),
      ('Home & Apartment', 'et kjøkken', 'a kitchen', 4),
      ('Home & Apartment', 'et bad', 'a bathroom', 5),
      ('Home & Apartment', 'et soverom', 'a bedroom', 6),
      ('Home & Apartment', 'en stue', 'a living room', 7),
      ('Home & Apartment', 'ei dør', 'a door', 8),
      ('Home & Apartment', 'et vindu', 'a window', 9),
      ('Home & Apartment', 'et bord', 'a table', 10),
      ('Home & Apartment', 'en stol', 'a chair', 11),
      ('Home & Apartment', 'ei seng', 'a bed', 12),
      ('Home & Apartment', 'en sofa', 'a sofa', 13),
      ('Home & Apartment', 'ei lampe', 'a lamp', 14),
      ('Home & Apartment', 'en nøkkel', 'a key', 15),
      ('Home & Apartment', 'en vaskemaskin', 'a washing machine', 16),
      ('Home & Apartment', 'et kjøleskap', 'a refrigerator', 17),
      ('Home & Apartment', 'en ovn', 'an oven', 18),
      ('Home & Apartment', 'å leie', 'to rent', 19),

      ('Numbers, Time & Days', 'én', 'one', 0),
      ('Numbers, Time & Days', 'to', 'two', 1),
      ('Numbers, Time & Days', 'tre', 'three', 2),
      ('Numbers, Time & Days', 'fire', 'four', 3),
      ('Numbers, Time & Days', 'fem', 'five', 4),
      ('Numbers, Time & Days', 'mandag', 'Monday', 5),
      ('Numbers, Time & Days', 'tirsdag', 'Tuesday', 6),
      ('Numbers, Time & Days', 'onsdag', 'Wednesday', 7),
      ('Numbers, Time & Days', 'torsdag', 'Thursday', 8),
      ('Numbers, Time & Days', 'fredag', 'Friday', 9),
      ('Numbers, Time & Days', 'lørdag', 'Saturday', 10),
      ('Numbers, Time & Days', 'søndag', 'Sunday', 11),
      ('Numbers, Time & Days', 'klokka', 'the time / clock', 12),
      ('Numbers, Time & Days', 'tid', 'time', 13),
      ('Numbers, Time & Days', 'i dag', 'today', 14),
      ('Numbers, Time & Days', 'i morgen', 'tomorrow', 15),
      ('Numbers, Time & Days', 'i går', 'yesterday', 16),
      ('Numbers, Time & Days', 'nå', 'now', 17),
      ('Numbers, Time & Days', 'tidlig', 'early', 18),
      ('Numbers, Time & Days', 'sent', 'late', 19),

      ('Places Around Town', 'en butikk', 'a shop', 0),
      ('Places Around Town', 'et supermarked', 'a supermarket', 1),
      ('Places Around Town', 'et apotek', 'a pharmacy', 2),
      ('Places Around Town', 'en skole', 'a school', 3),
      ('Places Around Town', 'et universitet', 'a university', 4),
      ('Places Around Town', 'en barnehage', 'a kindergarten', 5),
      ('Places Around Town', 'en arbeidsplass', 'a workplace', 6),
      ('Places Around Town', 'et kontor', 'an office', 7),
      ('Places Around Town', 'en bank', 'a bank', 8),
      ('Places Around Town', 'et postkontor', 'a post office', 9),
      ('Places Around Town', 'en restaurant', 'a restaurant', 10),
      ('Places Around Town', 'en kafé', 'a café', 11),
      ('Places Around Town', 'et bibliotek', 'a library', 12),
      ('Places Around Town', 'en park', 'a park', 13),
      ('Places Around Town', 'et toalett', 'a toilet', 14),
      ('Places Around Town', 'en politistasjon', 'a police station', 15),
      ('Places Around Town', 'et sykehus', 'a hospital', 16),
      ('Places Around Town', 'sentrum', 'the city center', 17),
      ('Places Around Town', 'en adresse', 'an address', 18),
      ('Places Around Town', 'et sted', 'a place', 19),

      ('Transport & Directions', 'en buss', 'a bus', 0),
      ('Transport & Directions', 'et tog', 'a train', 1),
      ('Transport & Directions', 'en trikk', 'a tram', 2),
      ('Transport & Directions', 'en T-bane', 'a metro', 3),
      ('Transport & Directions', 'en bil', 'a car', 4),
      ('Transport & Directions', 'en sykkel', 'a bicycle', 5),
      ('Transport & Directions', 'en holdeplass', 'a stop', 6),
      ('Transport & Directions', 'en stasjon', 'a station', 7),
      ('Transport & Directions', 'en billett', 'a ticket', 8),
      ('Transport & Directions', 'å kjøre', 'to drive', 9),
      ('Transport & Directions', 'å reise', 'to travel', 10),
      ('Transport & Directions', 'å vente', 'to wait', 11),
      ('Transport & Directions', 'høyre', 'right', 12),
      ('Transport & Directions', 'venstre', 'left', 13),
      ('Transport & Directions', 'rett fram', 'straight ahead', 14),
      ('Transport & Directions', 'nord', 'north', 15),
      ('Transport & Directions', 'sør', 'south', 16),
      ('Transport & Directions', 'øst', 'east', 17),
      ('Transport & Directions', 'vest', 'west', 18),
      ('Transport & Directions', 'nær', 'near', 19),

      ('Useful Adjectives', 'god', 'good', 0),
      ('Useful Adjectives', 'dårlig', 'bad', 1),
      ('Useful Adjectives', 'stor', 'big', 2),
      ('Useful Adjectives', 'liten', 'small', 3),
      ('Useful Adjectives', 'ny', 'new', 4),
      ('Useful Adjectives', 'gammel', 'old', 5),
      ('Useful Adjectives', 'varm', 'warm', 6),
      ('Useful Adjectives', 'kald', 'cold', 7),
      ('Useful Adjectives', 'dyr', 'expensive', 8),
      ('Useful Adjectives', 'billig', 'cheap', 9),
      ('Useful Adjectives', 'lett', 'easy / light', 10),
      ('Useful Adjectives', 'vanskelig', 'difficult', 11),
      ('Useful Adjectives', 'rask', 'fast', 12),
      ('Useful Adjectives', 'langsom', 'slow', 13),
      ('Useful Adjectives', 'åpen', 'open', 14),
      ('Useful Adjectives', 'stengt', 'closed', 15),
      ('Useful Adjectives', 'ledig', 'available / free', 16),
      ('Useful Adjectives', 'opptatt', 'busy / occupied', 17),
      ('Useful Adjectives', 'viktig', 'important', 18),
      ('Useful Adjectives', 'ferdig', 'finished / ready', 19),

      ('Shopping & Money', 'penger', 'money', 0),
      ('Shopping & Money', 'ei krone', 'a krone', 1),
      ('Shopping & Money', 'en pris', 'a price', 2),
      ('Shopping & Money', 'et bankkort', 'a bank card', 3),
      ('Shopping & Money', 'kontanter', 'cash', 4),
      ('Shopping & Money', 'en kvittering', 'a receipt', 5),
      ('Shopping & Money', 'en pose', 'a bag', 6),
      ('Shopping & Money', 'en størrelse', 'a size', 7),
      ('Shopping & Money', 'et tilbud', 'an offer / sale', 8),
      ('Shopping & Money', 'en kasse', 'a checkout', 9),
      ('Shopping & Money', 'en kø', 'a queue', 10),
      ('Shopping & Money', 'å kjøpe', 'to buy', 11),
      ('Shopping & Money', 'å betale', 'to pay', 12),
      ('Shopping & Money', 'å koste', 'to cost', 13),
      ('Shopping & Money', 'å selge', 'to sell', 14),
      ('Shopping & Money', 'å prøve', 'to try', 15),
      ('Shopping & Money', 'å bytte', 'to exchange', 16),
      ('Shopping & Money', 'å returnere', 'to return', 17),
      ('Shopping & Money', 'ti', 'ten', 18),
      ('Shopping & Money', 'hundre', 'one hundred', 19),

      ('Work, Study & Appointments', 'en jobb', 'a job', 0),
      ('Work, Study & Appointments', 'arbeid', 'work', 1),
      ('Work, Study & Appointments', 'en kollega', 'a colleague', 2),
      ('Work, Study & Appointments', 'en sjef', 'a manager / boss', 3),
      ('Work, Study & Appointments', 'et møte', 'a meeting', 4),
      ('Work, Study & Appointments', 'en avtale', 'an appointment / agreement', 5),
      ('Work, Study & Appointments', 'en time', 'an appointment / hour', 6),
      ('Work, Study & Appointments', 'en kalender', 'a calendar', 7),
      ('Work, Study & Appointments', 'en e-post', 'an email', 8),
      ('Work, Study & Appointments', 'en telefon', 'a phone', 9),
      ('Work, Study & Appointments', 'å jobbe', 'to work', 10),
      ('Work, Study & Appointments', 'å studere', 'to study', 11),
      ('Work, Study & Appointments', 'å lære', 'to learn', 12),
      ('Work, Study & Appointments', 'å lese', 'to read', 13),
      ('Work, Study & Appointments', 'å skrive', 'to write', 14),
      ('Work, Study & Appointments', 'å ringe', 'to call', 15),
      ('Work, Study & Appointments', 'å sende', 'to send', 16),
      ('Work, Study & Appointments', 'å begynne', 'to begin', 17),
      ('Work, Study & Appointments', 'å slutte', 'to stop / finish', 18),
      ('Work, Study & Appointments', 'forsinket', 'delayed / late', 19),

      ('Weather & Nature', 'vær', 'weather', 0),
      ('Weather & Nature', 'sol', 'sun', 1),
      ('Weather & Nature', 'regn', 'rain', 2),
      ('Weather & Nature', 'snø', 'snow', 3),
      ('Weather & Nature', 'vind', 'wind', 4),
      ('Weather & Nature', 'en sky', 'a cloud', 5),
      ('Weather & Nature', 'en temperatur', 'a temperature', 6),
      ('Weather & Nature', 'en grad', 'a degree', 7),
      ('Weather & Nature', 'en årstid', 'a season', 8),
      ('Weather & Nature', 'vår', 'spring', 9),
      ('Weather & Nature', 'sommer', 'summer', 10),
      ('Weather & Nature', 'høst', 'autumn', 11),
      ('Weather & Nature', 'vinter', 'winter', 12),
      ('Weather & Nature', 'et fjell', 'a mountain', 13),
      ('Weather & Nature', 'en skog', 'a forest', 14),
      ('Weather & Nature', 'en sjø', 'a lake / sea', 15),
      ('Weather & Nature', 'ei elv', 'a river', 16),
      ('Weather & Nature', 'å regne', 'to rain', 17),
      ('Weather & Nature', 'å snø', 'to snow', 18),
      ('Weather & Nature', 'glatt', 'slippery / icy', 19),

      ('Health, Body & Feelings', 'en lege', 'a doctor', 0),
      ('Health, Body & Feelings', 'en tannlege', 'a dentist', 1),
      ('Health, Body & Feelings', 'medisin', 'medicine', 2),
      ('Health, Body & Feelings', 'en smerte', 'a pain', 3),
      ('Health, Body & Feelings', 'et hode', 'a head', 4),
      ('Health, Body & Feelings', 'ei hånd', 'a hand', 5),
      ('Health, Body & Feelings', 'en fot', 'a foot', 6),
      ('Health, Body & Feelings', 'en mage', 'a stomach', 7),
      ('Health, Body & Feelings', 'en rygg', 'a back', 8),
      ('Health, Body & Feelings', 'et hjerte', 'a heart', 9),
      ('Health, Body & Feelings', 'syk', 'ill', 10),
      ('Health, Body & Feelings', 'frisk', 'healthy / well', 11),
      ('Health, Body & Feelings', 'trøtt', 'tired', 12),
      ('Health, Body & Feelings', 'sulten', 'hungry', 13),
      ('Health, Body & Feelings', 'tørst', 'thirsty', 14),
      ('Health, Body & Feelings', 'glad', 'happy', 15),
      ('Health, Body & Feelings', 'trist', 'sad', 16),
      ('Health, Body & Feelings', 'redd', 'afraid', 17),
      ('Health, Body & Feelings', 'stresset', 'stressed', 18),
      ('Health, Body & Feelings', 'å ha vondt', 'to be in pain', 19),

      ('Everyday Connectors & Phrases', 'og', 'and', 0),
      ('Everyday Connectors & Phrases', 'eller', 'or', 1),
      ('Everyday Connectors & Phrases', 'men', 'but', 2),
      ('Everyday Connectors & Phrases', 'fordi', 'because', 3),
      ('Everyday Connectors & Phrases', 'så', 'so / then', 4),
      ('Everyday Connectors & Phrases', 'også', 'also', 5),
      ('Everyday Connectors & Phrases', 'bare', 'only / just', 6),
      ('Everyday Connectors & Phrases', 'veldig', 'very', 7),
      ('Everyday Connectors & Phrases', 'litt', 'a little', 8),
      ('Everyday Connectors & Phrases', 'mye', 'much / a lot', 9),
      ('Everyday Connectors & Phrases', 'med', 'with', 10),
      ('Everyday Connectors & Phrases', 'uten', 'without', 11),
      ('Everyday Connectors & Phrases', 'for', 'for / too', 12),
      ('Everyday Connectors & Phrases', 'til', 'to', 13),
      ('Everyday Connectors & Phrases', 'fra', 'from', 14),
      ('Everyday Connectors & Phrases', 'på', 'on / at', 15),
      ('Everyday Connectors & Phrases', 'i', 'in', 16),
      ('Everyday Connectors & Phrases', 'ikke', 'not', 17),
      ('Everyday Connectors & Phrases', 'alltid', 'always', 18),
      ('Everyday Connectors & Phrases', 'aldri', 'never', 19)
    ) AS vocab_data(lesson_title, front, back, word_order)
    INNER JOIN lessons
      ON lessons.deck_id = core_deck_id
      AND lessons.title = vocab_data.lesson_title;

    SELECT count(*)
    INTO seeded_vocab_count
    FROM vocabs
    INNER JOIN lessons ON lessons.id = vocabs.lesson_id
    WHERE lessons.deck_id = core_deck_id;

    IF seeded_vocab_count <> 300 THEN
      RAISE EXCEPTION 'Expected 300 vocabulary items, inserted %.', seeded_vocab_count;
    END IF;

    RAISE NOTICE 'Created Norwegian Core 300 with deck id %.', core_deck_id;
  END IF;
END;
$seed$;
