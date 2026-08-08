import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("=== REVISANDO BASE DE DATOS SUPABASE ===");
  
  // 1. Revisar perfiles (usuarios)
  const { data: profiles, error: errProfile } = await supabase.from('profiles').select('*');
  console.log("\n1. USUARIOS REGISTRADOS:");
  if (errProfile) console.log("Error:", errProfile.message);
  else console.log(profiles);

  // 2. Revisar transacciones
  const { data: transactions, error: errTx } = await supabase.from('transactions').select('*');
  console.log("\n2. TRANSACCIONES EN LA NUBE:");
  if (errTx) console.log("Error:", errTx.message);
  else {
    if (transactions.length === 0) console.log("La tabla está VACÍA (0 registros).");
    else console.log(transactions);
  }

  // 3. Revisar categorias
  const { data: categories, error: errCat } = await supabase.from('categories').select('*');
  console.log("\n3. CATEGORÍAS EN LA NUBE:");
  if (errCat) console.log("Error:", errCat.message);
  else {
    if (categories.length === 0) console.log("La tabla está VACÍA (0 registros).");
    else console.log(categories);
  }
}

checkDatabase();
