/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const count = await knex('animals_species').count('* as total').first();

  if (count.total === 0) {
    await knex('animals_species').insert([
      { species_name: 'British Shorthair', animal_id: 1 },
      { species_name: 'Scottish Fold', animal_id: 1 },
      { species_name: 'Siyam', animal_id: 1 },
      { species_name: 'Maine Coon', animal_id: 1 },
      { species_name: 'Persian', animal_id: 1 },
      { species_name: 'Sphynx', animal_id: 1 },
      { species_name: 'Bengal', animal_id: 1 },
      { species_name: 'Ragdoll', animal_id: 1 },
      { species_name: 'Abyssinian', animal_id: 1 },
      { species_name: 'Birman', animal_id: 1 },
      { species_name: 'Russian Blue (Rus mavi)', animal_id: 1 },
      { species_name: 'Burmese (Burma)', animal_id: 1 },
      { species_name: 'Turkish Van (Türk Van kedisi)', animal_id: 1 },
      { species_name: 'Turkish Angora (Türk angorası)', animal_id: 1 },
      { species_name: 'Devon Rex', animal_id: 1 },
      { species_name: 'Cornish Rex', animal_id: 1 },
      { species_name: 'Oriental Shorthair', animal_id: 1 },
      { species_name: 'American Shorthair', animal_id: 1 },
      { species_name: 'Japanese Bobtail (Japon bobtail)', animal_id: 1 },
      { species_name: 'Manx (Man adası) bunları knexle', animal_id: 1 },
      { species_name: 'Angora', animal_id: 1 },

      // Köpekler
      { species_name: 'Akita', animal_id: 2 },
      { species_name: 'Bulldog (İngiliz, Fransız, Amerikan vs.)', animal_id: 2 },
      { species_name: 'Labrador Retriever', animal_id: 2 },
      { species_name: 'German Shepherd (Alman Çoban Köpeği)', animal_id: 2 },
      { species_name: 'Golden Retriever', animal_id: 2 },
      { species_name: 'Poodle (Kaniche)', animal_id: 2 },
      { species_name: 'Dachshund (Sosis Köpek)', animal_id: 2 },
      { species_name: 'Beagle', animal_id: 2 },
      { species_name: 'Boxer', animal_id: 2 },
      { species_name: 'Rottweiler', animal_id: 2 },
      { species_name: 'Siberian Husky', animal_id: 2 },
      { species_name: 'Chihuahua', animal_id: 2 },
      { species_name: 'Pug (Mops)', animal_id: 2 },
      { species_name: 'Shih Tzu', animal_id: 2 },
      { species_name: 'Border Collie', animal_id: 2 },
      { species_name: 'Cocker Spaniel', animal_id: 2 },
      { species_name: 'Yorkshire Terrier', animal_id: 2 },
      { species_name: 'Maltese (Malta köpeği)', animal_id: 2 },
      { species_name: 'Great Dane (Büyük Dane)', animal_id: 2 },
      { species_name: 'Pomeranian (Pom)', animal_id: 2 },
      { species_name: 'Doberman Pinscher', animal_id: 2 },
      { species_name: 'Australian Shepherd (Avustralya Çoban Köpeği)', animal_id: 2 },
      { species_name: 'Jack Russell Terrier', animal_id: 2 },
      { species_name: 'Bull Terrier', animal_id: 2 },

      // Papağanlar
      { species_name: 'Muhabbet kuşu', animal_id: 3 },
      { species_name: 'İskender papağanı', animal_id: 3 },
      { species_name: 'Amazon papağanı', animal_id: 3 },
      { species_name: 'Caique', animal_id: 3 },
      { species_name: 'Kakadu (Siyah gagalı kakadu, Pembe gagalı kakadu)', animal_id: 3 },
      { species_name: 'Grey papağan (African Grey)', animal_id: 3 },
      { species_name: 'Conure (Yeşil yanaklı conure, Sun conure)', animal_id: 3 },
      { species_name: 'Lorikeet', animal_id: 3 },
      { species_name: 'Budgerigar (Muhabbet kuşu)', animal_id: 3 },
      { species_name: 'Lovebird (Muhabbet kuşu)', animal_id: 3 },

      // Balıklar
      { species_name: 'Guppy', animal_id: 4 },
      { species_name: 'Neon Tetra', animal_id: 4 },
      { species_name: 'Angelfish (Melek balığı)', animal_id: 4 },
      { species_name: 'Betta (Kavgacı balık)', animal_id: 4 },
      { species_name: 'Goldfish (Japon balığı)', animal_id: 4 },
      { species_name: 'Swordtail', animal_id: 4 },
      { species_name: 'Mollies (Moli balığı)', animal_id: 4 },
      { species_name: 'Platies', animal_id: 4 },
      { species_name: 'Corydoras (Pleko)', animal_id: 4 },
      { species_name: 'Discus', animal_id: 4 },

      // İnekler
      { species_name: 'Holstein-Friesian', animal_id: 5 },
      { species_name: 'Jersey', animal_id: 5 },
      { species_name: 'Guernsey', animal_id: 5 },
      { species_name: 'Brown Swiss', animal_id: 5 },
      { species_name: 'Ayrshire', animal_id: 5 },

      // Koyunlar
      { species_name: 'Merinos', animal_id: 6 },
      { species_name: 'Suffolk', animal_id: 6 },
      { species_name: 'Dorset', animal_id: 6 },
      { species_name: 'Hampshire', animal_id: 6 },
      { species_name: 'Texel', animal_id: 6 },

      // Tavşanlar
      { species_name: 'Holland Lop', animal_id: 7 },
      { species_name: 'Mini Rex', animal_id: 7 },
      { species_name: 'Lionhead', animal_id: 7 },
      { species_name: 'Flemish Giant', animal_id: 7 },
      { species_name: 'Netherland Dwarf', animal_id: 7 },
      { species_name: 'Dutch', animal_id: 7 },

      // Kuşlar
      { species_name: 'Kanarya', animal_id: 8 },
      { species_name: 'Muhabbet kuşu', animal_id: 8 },
      { species_name: 'Papagan (Ara, Kakadu, Caique, Macaw vs.)', animal_id: 8 },
      { species_name: 'Finch (Zebra Finch, Gouldian Finch)', animal_id: 8 },
      { species_name: 'Cockatiel (Nymphicus hollandicus)', animal_id: 8 },
      { species_name: 'Budgerigar (Muhabbet kuşu)', animal_id: 8 },
      { species_name: 'Lovebird (Muhabbet kuşu)', animal_id: 8 },
      { species_name: 'Conure (Yeşil yanaklı conure, Sun conure)', animal_id: 8 },
      { species_name: 'Parakeet (Budgerigar, Monk parakeet)', animal_id: 8 },
      { species_name: 'Lorikeet', animal_id: 8 },

      // Atlar
      { species_name: 'Arabian (Arap atı)', animal_id: 9 },
      { species_name: 'Thoroughbred (İngiliz yarış atı)', animal_id: 9 },
      { species_name: 'Quarter Horse', animal_id: 9 },
      { species_name: 'Shetland Pony', animal_id: 9 },
      { species_name: 'Appaloosa', animal_id: 9 },
      { species_name: 'Friesian (Friz atı)', animal_id: 9 },
      { species_name: 'Andalusian (Andaluz atı)', animal_id: 9 },
      { species_name: 'American Paint Horse', animal_id: 9 },
      { species_name: 'Morgan', animal_id: 9 },
      { species_name: 'Icelandic Horse (İzlanda atı)', animal_id: 9 },
      { species_name: 'Mustang', animal_id: 9 },

      // Keçiler
      { species_name: 'Angora keçisi', animal_id: 10 },
      { species_name: 'Boer keçisi', animal_id: 10 },
      { species_name: 'Saanen', animal_id: 10 },
      { species_name: 'Nubian', animal_id: 10 },
      { species_name: 'Toggenburg', animal_id: 10 }
    ]);
  }
};
