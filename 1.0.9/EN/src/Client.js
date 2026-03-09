const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const Context = require('./Context');
const fs = require('fs');
const path = require('path');

class EasyBot {
    constructor(options = {}) {
        // Token verification and clearing
        this.token = typeof options.token === 'string' ? options.token.trim() : options.token;
        
        this.client = new Client({
            intents: options.intents || [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.GuildMessages, 
                GatewayIntentBits.MessageContent
            ]
        });
        this.commands = new Map();
    }

    // --- module system  ---

    useModule(moduleName) {
        const modulePath = path.join(process.cwd(), 'modules', moduleName, 'index.js');
        
        try {
            if (fs.existsSync(modulePath)) {
                // version validation 
                this.constructor.checkModule(path.dirname(modulePath));

                const module = require(modulePath);
                
                if (typeof module.init === 'function') {
                    module.init(this); 
                    console.log(`📦 [DNT] Módulo '${moduleName}' loaded successfully `);
                } else {
                    console.error(`❌ [DNT] the módulo '${moduleName}' no have the function init().`);
                }
            } else {
                console.error(`❌ [DNT] Módulo '${moduleName}' not found in ./modules/`);
            }
        } catch (err) {
            console.error(`❌ [DNT] Error loading module.  '${moduleName}':`, err.message);
        }
    }

    static checkModule(modulePath) {
        const manifestPath = path.join(modulePath, 'manifest.dnt');
        
        if (!fs.existsSync(manifestPath)) {
            console.error("❌ [DNT] Error: Invalid module (missing manifest.dnt)");
            return;
        }

        const content = fs.readFileSync(manifestPath, 'utf8');
        const config = {};
        
        content.split('\n').forEach(line => {
            if(line.includes('=')) {
                const [key, value] = line.split('=');
                config[key.trim()] = value.trim();
            }
        });

        const currentLibVersion = "1.0.9"; 

        if (config.compatible_dnt > currentLibVersion) {
            console.error(`\n❌ [DNT ERROR]: the módulo '${config.name}' requires the following version: ${config.compatible_dnt}.`);
            console.error(`Your version of ndj-lib is: ${currentLibVersion}. Atualize a lib!`);
            process.exit(1);
        }
    }

    // --- command system ---

    command({ name, description, options, run }) {
        // Register the command in the Map, including the options array.
        this.commands.set(name, { 
            description, 
            options: options || [], 
            run 
        });
    }

    async start() {
        if (!this.token) throw new Error("error: You need to set a token!");

        this.client.once(Events.ClientReady, async (c) => {
            console.log(`✅ bot online: ${c.user.tag}`);
            
            const rest = new REST({ version: '10' }).setToken(this.token);
            
            // Maps commands to Discord's JSON format, including options.
            const commandsJSON = Array.from(this.commands.entries()).map(([name, cmd]) => ({
                name: name,
                description: cmd.description,
                options: cmd.options // Slash command value 
            }));

            try {
                await rest.put(Routes.applicationCommands(c.user.id), { body: commandsJSON });
                console.log('🚀 Slash command successfully registered. ');
                console.log('Created by Ghost in https://github.com/pitocoofc/Ndj-lib.git');
            } catch (error) {
                console.error('❌ Error registering Slash command:', error);
            }
        });

        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const cmd = this.commands.get(interaction.commandName);
            if (cmd) {
                const ctx = new Context(interaction);
                try {
                    await cmd.run(ctx);
                } catch (err) {
                    console.error("error in the command:", err);
                    if (!interaction.replied) {
                        interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            }
        });

        await this.client.login(this.token);
    }
}

module.exports = EasyBot; 
