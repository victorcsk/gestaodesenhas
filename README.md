# Sistema de Gestão de Senhas

Sistema completo de gerenciamento de senhas para atendimento interno com analytics em tempo real.

## 🚀 Funcionalidades

- **Geração de Senhas** por setor (Suporte, Hardware, Telefonia, Ativos)
- **Painéis de Atendimento** para cada setor
- **Painel Público** com visualização em tempo real
- **Dashboard de Analytics** com métricas e relatórios
- **Sincronização em Tempo Real** via Firebase
- **Sistema de Som** com notificações por voz
- **Impressão de Senhas** automática

## 🔧 Configuração do Firebase

Para usar em produção, você precisa configurar o Firebase:

### 1. Criar Projeto Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Siga os passos de criação

### 2. Ativar Realtime Database
1. No console do Firebase, vá em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha "Modo de teste" para começar
4. Selecione a localização (us-central1 recomendado)

### 3. Configurar Regras de Segurança
No Realtime Database, vá em "Regras" e use:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "events": {
      ".indexOn": "timestamp"
    }
  }
}
```

### 4. Obter Credenciais
1. Vá em "Configurações do projeto" (ícone de engrenagem)
2. Na aba "Geral", role até "Seus aplicativos"
3. Clique em "Adicionar app" > "Web"
4. Registre o app e copie as credenciais

### 5. Atualizar Configuração
Substitua as credenciais em `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxxxxxxx"
};
```

## 📱 Como Usar

### Desenvolvimento Local
```bash
npm install
npm run dev
```

### Produção
```bash
npm run build
npm run preview
```

## 🎯 Estrutura do Sistema

- **Tela Principal**: Acesso a todos os módulos
- **Retirada de Senhas**: Interface para usuários gerarem senhas
- **Painéis de Setor**: Interface para atendentes chamarem próxima senha
- **Painel Público**: Visualização das senhas chamadas
- **Analytics**: Dashboard com métricas e relatórios

## 🔄 Sincronização

O sistema usa Firebase Realtime Database para sincronização instantânea entre:
- Múltiplos dispositivos
- Diferentes painéis
- Geração e chamada de senhas
- Atualizações de analytics

## 📊 Analytics

- Atendimentos por dia/semana/mês
- Comparação entre períodos
- Métricas por setor
- Tempo médio de espera
- Relatórios de produtividade

## 🎵 Sistema de Som

- Notificação sonora quando senha é chamada
- Síntese de voz com nome do setor e número
- Controle de volume e ativação/desativação
- Compatível com diferentes navegadores