import { closeDB, initDB } from './src/db.js';
import { runCli } from './src/cli.js';

async function main() {
  try {
    await initDB();
    console.log('Connected to MySQL. Database and tables are ready.');
    await runCli();
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('That email address is already registered.');
    } else {
      console.error(`Application error: ${error.message}`);
    }
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

main();
