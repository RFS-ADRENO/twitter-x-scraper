import { spawn } from 'child_process';

let bot = spawn("node", ["bot.js"], {
	cwd: process.cwd(),
	stdio: 'inherit',
	env: process.env,
});

bot.on('close', (code) => {
	console.log(`Received exit code ${code} from child process`);
	console.log("Restarting bot...");

	bot = spawn("node", ["bot.js"], {
		cwd: process.cwd(),
		stdio: 'inherit',
		env: process.env,
	});
});
