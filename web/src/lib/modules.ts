import type { ModuleInfo } from "@/components/modules/unavailable-module";

const SERVER = "o servidor do Pollo OS, com login, empresas separadas e conversas reais.";

/** Os módulos que ainda não funcionam nesta versão, por endereço (sem a barra). */
export const UNAVAILABLE_MODULES: Record<string, ModuleInfo> = {
  agenda: {
    title: "Agenda",
    summary: "Suas reuniões executivas com o Pollo CEO: próximas sessões, pautas, atas e decisões.",
    will: [
      "Marcar uma reunião com o Pollo CEO e montar a pauta",
      "Conversar por voz na hora marcada, quando a voz estiver conectada",
      "Revisar e confirmar a ata antes que uma decisão entre na memória da empresa",
      "Ver o histórico de reuniões, decisões e pendências",
    ],
    needs: `${SERVER} Para a voz, um provedor de voz em tempo real.`,
    note: "A agenda de vendas e de atendimento continua no FlipForm. Esta é a agenda da sua relação com a IA.",
    link: { href: "/", label: "Conversar com o Pollo CEO" },
  },
  "visao-geral": {
    title: "Visão Geral",
    summary: "O panorama executivo da empresa, num lugar só, sempre com a fonte e o período de cada número.",
    will: [
      "Ver poucos indicadores que importam, na versão executiva ou analítica",
      "Acompanhar riscos, tendências e decisões pendentes",
      "Abrir o app de origem de cada número para se aprofundar",
    ],
    needs: "pelo menos uma fonte de dados conectada, como o FlipForm ou o Flip Intelligence.",
    note: "Sem funil de vendas nem painel operacional: isso continua no FlipForm.",
    link: { href: "/apps", label: "Ver os apps" },
  },
  "segundo-cerebro": {
    title: "Segundo Cérebro",
    summary: "A memória da empresa: decisões, aprendizados, documentos e fontes, ligados entre si.",
    will: [
      "Guardar decisões e aprendizados validados, com fonte e data",
      "Ligar notas e documentos entre si e navegar pelas relações",
      "Controlar o que cada pessoa e cada agente pode ver",
    ],
    needs: SERVER,
    link: { href: "/", label: "Conversar com o Pollo CEO" },
  },
  rotinas: {
    title: "Rotinas",
    summary: "O que os seus agentes fazem sozinhos, no horário ou na condição que você escolher.",
    will: [
      "Agendar tarefas recorrentes, como um resumo todo dia às 8h",
      "Fazer check-ins e acompanhar metas",
      "Disparar um agente quando algo acontecer num app",
    ],
    needs: SERVER,
    link: { href: "/agentes", label: "Ir para Agentes & Operações" },
  },
  aprovacoes: {
    title: "Decisões & Aprovações",
    summary: "Tudo o que os agentes pedem para fazer e precisa da sua confirmação, com a trilha de quem decidiu.",
    will: [
      "Aprovar ou recusar o que um agente quer fazer fora do Pollo OS",
      "Definir critérios: o que sempre pede aprovação e o que nunca pode ser feito",
      "Consultar o histórico de decisões",
    ],
    needs: SERVER,
    link: { href: "/agentes", label: "Ir para Agentes & Operações" },
  },
  atividade: {
    title: "Atividade",
    summary: "O que cada agente fez, quando, com que fonte, quanto custou e o resultado.",
    will: [
      "Ver os trabalhos pendentes, em execução, concluídos e com falha",
      "Saber quem pediu cada trabalho e quem aprovou",
      "Encontrar a fonte de cada resultado",
    ],
    needs: `${SERVER} Nada aparece aqui até haver trabalho real registrado.`,
    link: { href: "/agentes", label: "Ir para Agentes & Operações" },
  },
  consumo: {
    title: "Consumo & Custos",
    summary: "Quanto a empresa usa de IA, por agente, serviço e modalidade (texto ou voz), e os limites de cada um.",
    will: [
      "Acompanhar o consumo do mês",
      "Definir limites por empresa, agente e serviço",
      "Receber um aviso antes de passar do limite",
    ],
    needs: `${SERVER} E o modelo de IA ligado, para haver consumo a medir.`,
    link: { href: "/", label: "Voltar para a Home" },
  },
  habilidades: {
    title: "Habilidades",
    summary: "As instruções que os agentes seguem para fazer bem um tipo de tarefa.",
    will: [
      "Escrever e editar habilidades, como “como responder um cliente insatisfeito”",
      "Escolher quais agentes usam cada habilidade",
    ],
    needs: SERVER,
    link: { href: "/agentes", label: "Ir para Agentes & Operações" },
  },
  configuracoes: {
    title: "Configurações",
    summary: "Sua conta, a sua empresa, as pessoas, o cofre de conexões e as preferências do Pollo OS.",
    will: [
      "Editar o perfil e as notificações",
      "Convidar pessoas e definir o que cada uma pode fazer",
      "Guardar as conexões com segurança",
    ],
    needs: SERVER,
    link: { href: "/", label: "Voltar para a Home" },
  },
  ajuda: {
    title: "Ajuda",
    summary: "Guias rápidos para tirar o melhor do Pollo CEO e dos seus agentes.",
    will: ["Aprender a criar um agente", "Entender as aprovações", "Ligar os apps da Pollo"],
    needs: "os guias ainda estão sendo escritos.",
    link: { href: "/", label: "Voltar para a Home" },
  },
};
