import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Limpar dados existentes
    await prisma.project.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Projeto "em atenção"
    const p1 = await prisma.project.create({
        data: {
            name: "Implantação do Novo Sistema de CRM",
            manager: "Ana Pereira",
            budget: 350000.00,
            stakeholders: "Vendas, Marketing, Suporte ao Cliente",
            classification: "HYBRID",
            status: "YELLOW", // Em atenção
            problems: "O time de vendas está com dificuldades na adoção da nova ferramenta, e a integração com o sistema de marketing está apresentando atrasos.",
            returns: "Aumento de 25% na eficiência do funil de vendas e centralização dos dados do cliente.",
            impacts: "Necessidade de um novo ciclo de treinamentos para a equipe de vendas."
        }
    });
    console.log(`Created Project (Em Atenção): ${p1.name}`);

    // 2. Projeto "atrasado"
    const p2 = await prisma.project.create({
        data: {
            name: "Atualização da Infraestrutura de Rede",
            manager: "Roberto Silva",
            budget: 750000.00,
            stakeholders: "Diretoria de TI, Operações",
            classification: "TRADITIONAL",
            status: "RED", // Atrasado
            problems: "O fornecedor principal de hardware não cumpriu o prazo de entrega, impactando todo o cronograma do projeto em 4 semanas.",
            returns: "Aumento da velocidade da rede interna em 40% e maior estabilidade dos sistemas críticos.",
            impacts: "Congelamento de novas contratações no setor de TI até a conclusão do projeto."
        }
    });
    console.log(`Created Project (Atrasado): ${p2.name}`);

    // 3. Projeto "encerrado"
    const p3 = await prisma.project.create({
        data: {
            name: "Website Institucional 2025",
            manager: "Sofia Lima",
            budget: 150000.00,
            stakeholders: "Comunicação, Relações Públicas",
            classification: "AGILE",
            status: "COMPLETED", // Encerrado
            problems: "O website antigo estava desatualizado tecnologicamente e não era responsivo para dispositivos móveis.",
            returns: "Aumento de 50% no tráfego orgânico e melhoria na imagem da marca.",
            impacts: "O projeto foi entregue 10% abaixo do custo previsto e duas semanas antes do prazo."
        }
    });
    console.log(`Created Project (Encerrado): ${p3.name}`);

    // 4. Projeto do próprio App (meta) - AGORA COM MAIS DETALHES
    const p4 = await prisma.project.create({
        data: {
            name: "Desenvolvimento do PMO-App de Gestão de Projetos",
            manager: "Eduardo & Borges",
            budget: 500000.00,
            stakeholders: "Equipe de Desenvolvimento, Gestores de Projeto, Diretoria",
            classification: "AGILE",
            status: "GREEN", // No prazo
            problems: "A gestão de projetos na empresa era feita em planilhas, causando falta de visibilidade, retrabalho e dificuldade no acompanhamento do portfólio.",
            returns: "Centralizar a gestão de projetos, fornecer dashboards em tempo real para tomada de decisão, automatizar a criação de relatórios de status e padronizar a metodologia.",
            impacts: "Melhoria na comunicação entre as equipes, redução do tempo gasto em tarefas administrativas e maior previsibilidade nas entregas.",
            description: "Este é o projeto que deu vida a esta própria aplicação. O objetivo é criar uma ferramenta moderna e eficiente para o escritório de projetos (PMO) da organização.",
            objectives: {
                create: [
                    { text: "Centralizar 100% dos projetos e documentos relacionados em uma única plataforma.", order: 0 },
                    { text: "Reduzir o tempo de criação de relatórios de status em 50% através de automação.", order: 1 },
                    { text: "Aumentar a visibilidade do portfólio de projetos para a diretoria em 80%.", order: 2 },
                    { text: "Padronizar a metodologia de gestão de projetos (PMI/Agile) em toda a organização.", order: 3 }
                ]
            },
            stakeholdersList: {
                create: [
                    { name: "Diretoria de TI", role: "Patrocinador", email: "diretoria.ti@empresa.com", interest: "Alto", influence: "Alta" },
                    { name: "Gerentes de Projeto", role: "Usuário Chave", email: "pmos@empresa.com", interest: "Alto", influence: "Média" },
                    { name: "Equipes de Desenvolvimento", role: "Executores", email: "devs@empresa.com", interest: "Médio", influence: "Baixa" },
                    { name: "Analistas de Negócio", role: "Especificadores", email: "analistas@empresa.com", interest: "Alto", influence: "Média" }
                ]
            },
            charterItems: {
                create: [
                    { type: "JUSTIFICATIVA", text: "A necessidade de uma ferramenta robusta para gestão de projetos se tornou crítica devido ao crescimento exponencial do número de iniciativas e à complexidade inerente às mesmas." },
                    { type: "ESCOPO_INICIAL", text: "A plataforma permitirá o cadastro, acompanhamento, gerenciamento de riscos, e relatórios de status para todos os projetos da empresa." },
                    { type: "ESCOPO_INICIAL", text: "Integração com sistemas existentes como ERP e RH será considerada em fases futuras." },
                    { type: "PREMISSA", text: "A equipe de desenvolvimento terá acesso irrestrito aos recursos de cloud e ferramentas necessárias." },
                    { type: "RESTRICAO", text: "O orçamento inicial não contempla licenças de ferramentas de BI externas, utilizando apenas o que for desenvolvido internamente ou de código aberto." },
                    { type: "CRITERIOS_SUCESSO", text: "Lançamento da primeira versão (MVP) em 3 meses com funcionalidades básicas de cadastro e visualização de projetos." },
                    { type: "CRITERIOS_SUCESSO", text: "Redução de 20% no tempo de reuniões de status em 6 meses." }
                ]
            }
        }
    });
    console.log(`Created Project (Meta-App with details): ${p4.name}`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
