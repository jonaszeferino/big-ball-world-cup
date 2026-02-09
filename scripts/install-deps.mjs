import { execSync } from 'child_process';

try {
  console.log('Installing Supabase dependencies...');
  execSync('cd /vercel/share/v0-project && pnpm add @supabase/ssr@0.6.1 @supabase/supabase-js@2.49.1', {
    stdio: 'inherit'
  });
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Install failed:', error.message);
  process.exit(1);
}
