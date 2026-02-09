import { execSync } from 'child_process';

try {
  console.log('Installing Supabase dependencies...');
  execSync('pnpm add @supabase/ssr @supabase/supabase-js', {
    cwd: '/vercel/share/v0-project',
    stdio: 'inherit'
  });
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Install failed:', error.message);
}
