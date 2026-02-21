#!/usr/bin/env node
/*
 * Ndj-lib Installer Hub - "The Architect" Edition
 * Copyright (C) 2026 pitocoofc | GPL v2
 * * Este instalador garante a hierarquia completa de pastas e 
 * resolve dependências automaticamente.
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const repoVersions = "https://github.com/pitocoofc/NDJ-LIB-versions-.git";

const versoes = {
    "1": { nome: "1.0.9", folder: "1.0.9", desc: "Versão Estável (Estrutura Completa)" },
    "2": { nome: "1.1.0-Canary", folder: "1.1.0-Canary", desc: "Experimental (Pode conter bugs)" }
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Limpa o ambiente de pastas temporárias se houver erro anterior
function limpar() {
    if (fs.existsSync('temp_ndj')) {
        fs.rmSync('temp_ndj', { recursive: true, force: true });
    }
}

async function instalar(v) {
    limpar();
    console.log(`\n\x1b[33m[1/3]\x1b[0m 🚚 Conectando à Warehouse para buscar \x1b[1mv${v.nome}\x1b[0m...`);

    try {
        // O "Pulo do Gato": Comandos Git para baixar apenas uma pasta específica
        const comandoClone = `
            mkdir temp_ndj && cd temp_ndj && \
            git init -q && \
            git remote add origin ${repoVersions} && \
            git config core.sparseCheckout true && \
            echo "${v.folder}/" >> .git/info/sparse-checkout && \
            git pull -q origin main && \
            cp -r ${v.folder}/* .. && \
            cd ..
        `.trim();

        execSync(comandoClone, { stdio: 'inherit' });

        console.log(`\x1b[33m[2/3]\x1b[0m 📂 Hierarquia de arquivos preservada (src/, index, etc).`);
        
        // 3. Resolve o erro MODULE_NOT_FOUND instalando o que estiver no package.json
        console.log(`\x1b[33m[3/3]\x1b[0m 🛠️  Instalando dependências (npm install)...`);
        
        if (fs.existsSync('package.json')) {
            execSync('npm install', { stdio: 'inherit' });
        } else {
            console.log("\x1b[31m[!] Aviso: package.json não encontrado. Instale os módulos manualmente.\x1b[0m");
        }

        limpar();
        console.log("\x1b[32m%s\x1b[0m", "\n✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!");
        console.log(`A v${v.nome} agora está pronta para rodar no seu ambiente.`);
        console.log("Comando: \x1b[1mnode index.js\x1b[0m\n");
        process.exit(0);

    } catch (e) {
        limpar();
        console.log("\x1b[31m\n❌ FALHA NA INSTALAÇÃO:\x1b[0m");
        console.log("Certifique-se de que o 'git' está instalado no seu Termux.");
        console.log("Erro: " + e.message);
        process.exit(1);
    }
}

if (process.argv[2] !== 'portal') {
    console.log("\x1b[31m%s\x1b[0m", "\n[!] Use: ./ndj portal");
    process.exit(0);
}

console.clear();
console.log("\x1b[35m%s\x1b[0m", `
 ███▄    █ ▓█████▄  ▄▄▄       ██▓
 ██ ▀█   █ ▒██▀ ██▌▒████▄    ▓██▒
▓██  ▀█ ██▒░██   █▌▒██  ▀█▄  ▒██▒
▓██▒  ▐▌██▒░▓█▄   ▌░██▄▄▄▄██ ░██░
▒██░   ▓██░░▒████▓  ▓█   ▓██▒░██░
`);
console.log("\x1b[32m%s\x1b[0m", " --- NDJ-LIB | PORTAL DE VERSÕES --- \n");

Object.keys(versoes).forEach(k => {
    console.log(`\x1b[33m[${k}]\x1b[0m \x1b[1mv${versoes[k].nome}\x1b[0m - ${versoes[k].desc}`);
});

rl.question("\n\x1b[36mSelecione a versão para instalar:\x1b[0m ", (opt) => {
    const v = versoes[opt];
    if (!v) {
        console.log("Saindo...");
        process.exit(0);
    }
    instalar(v);
});
