import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const ptMessages = {
  common: {
    brand: {
      homeAriaLabel: "Página inicial",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Seleção de idioma",
      selectorMenuAriaLabel: "Menu de seleção de idioma",
      currentLocaleTitle: "Idioma atual: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Painel do proprietário",
        checkingContext: "Verificando o contexto do serviço...",
        subtitle:
          "O painel só é aberto após a conclusão do onboarding do proprietário e do fluxo de assinatura. O serviço ativo, o plano e o estado de acesso são mostrados abaixo.",
      },
      summary: {
        activeServiceLabel: "Serviço ativo",
        ownerLabel: "Proprietário",
        paidUntilLabel: "Pago até",
        loadingStatus: "Verificando o estado...",
        activeServiceFallback: "Nenhum serviço ativo encontrado",
        serviceGenericLabel: "Serviço",
      },
      notes: {
        loading: "Verificando o estado...",
        active:
          "Nota: os links do painel funcionam com o contexto de serviço selecionado. O fluxo de criar, editar e excluir anúncios foi unificado na seção Meus anúncios.",
        locked:
          "Nota: o painel está intencionalmente bloqueado nesta etapa. Use o botão de ação acima para o próximo passo.",
      },
      errors: {
        prefix: "Erro",
        dashboardStateLoadFailed:
          "Não foi possível carregar o estado do painel.",
        completeOwnerProfileFirst:
          "Conclua primeiro o perfil do proprietário.",
        phoneVerificationRequired:
          "A verificação do telefone deve ser concluída.",
        serviceSelectionRequired:
          "A seleção do serviço deve ser concluída primeiro.",
        activeSubscriptionNotFound:
          "Nenhuma assinatura ativa foi encontrada.",
        serviceNotFoundOrInactive:
          "O serviço não foi encontrado ou está inativo.",
        serverErrorOccurred:
          "Ocorreu um erro no servidor. Tente novamente mais tarde.",
        ownerIdentityRequired:
          "Conclua primeiro o perfil do proprietário.",
      },
      cards: {
        properties: {
          title: "Meus anúncios",
          text: "Veja todos os seus anúncios, crie um novo anúncio, edite anúncios ativos e exclua-os.",
        },
        profile: {
          title: "Detalhes do perfil",
          text: "Gerencie seu nome, número de telefone e outros detalhes do perfil.",
        },
        billing: {
          title: "Assinatura e pagamentos",
          text: "Verifique o estado e prossiga para o fluxo de pagamento.",
        },
        bookings: {
          title: "Solicitações de reserva",
          text: "Aprove ou recuse as solicitações recebidas.",
        },
        lockedChip: "Bloqueado",
        lockedDescriptions: {
          profile:
            "Esta seção permanece bloqueada dentro do painel. Use o botão de ação acima para abrir a página do perfil.",
          billing:
            "Nesta etapa, a seção de assinatura é aberta por meio do botão de ação. O cartão do painel permanece bloqueado.",
          properties:
            "Criar, editar e excluir anúncios só fica disponível após a conclusão do onboarding do proprietário e da assinatura.",
          default:
            "Esta seção não está disponível até que o onboarding do proprietário e a assinatura sejam concluídos.",
        },
      },
      states: {
        profileRequired: {
          badge: "O painel está bloqueado",
          title: "O perfil do proprietário é obrigatório",
          description:
            "Para usar os serviços, primeiro é necessário inserir as informações do proprietário. Até que o perfil seja concluído, o painel, o faturamento e outras seções permanecerão bloqueados.",
          cta: "Ir para a página do perfil",
        },
        phoneVerificationRequired: {
          badge: "A verificação OTP é obrigatória",
          title: "O telefone não está verificado",
          description:
            "O perfil foi criado como rascunho, mas o proprietário não é considerado ativo até que o telefone seja verificado com OTP. O painel e outras capacidades do proprietário permanecerão bloqueados.",
          cta: "Ir para o perfil e concluir a verificação",
        },
        serviceSelectionRequired: {
          badge: "A seleção do serviço é obrigatória",
          title: "Conclua primeiro a etapa dos serviços",
          description:
            "Após a conclusão do perfil, o proprietário deve primeiro retornar à seção de serviços. O painel permanece bloqueado nesta etapa.",
          cta: "Ir para os serviços",
        },
        subscriptionRequired: {
          badge: "A assinatura é obrigatória",
          title: "Nenhuma assinatura ativa",
          description:
            "Um serviço foi selecionado, mas o pagamento não foi concluído ou a assinatura está inativa. O painel permanecerá bloqueado e outros processos do proprietário continuarão bloqueados.",
          cta: "Ir para a assinatura",
        },
        active: {
          badge: "Ativo",
          title: "O painel está aberto",
          description:
            "A assinatura está ativa. O proprietário pode criar anúncios, gerenciar anúncios, processar solicitações de reserva e usar o sistema completamente.",
          cta: "Ver serviços",
        },
      },
      meta: {
        serviceCodeLabel: "Código do serviço",
        planLabel: "Plano",
        accessLabel: "Estado de acesso",
        planStandardLabel: "Padrão",
        planPlusLabel: "Plus",
        accessActiveLabel: "Aberto",
        accessLockedLabel: "Bloqueado",
      },
      services: {
        RENT_HOME: "Aluguel de casas",
        BARBER: "Barbearia",
        CAR_RENTAL: "Aluguel de carros",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Salão de beleza",
        BABYSITTER: "Babá",
        CLEANING: "Serviços de limpeza",
        TECHNICAL_SERVICES: "Serviços técnicos",
      },
    },
    services: {
      hero: {
        pageTitle: "Seleção de serviço",
        lockedDescription:
          "Esta página é o ponto de entrada do onboarding do proprietário. Até que o perfil e a verificação do telefone sejam concluídos, o fluxo do serviço, o faturamento e o painel permanecerão bloqueados.",
        activeDescription:
          "Primeiro escolha um plano, depois escolha o serviço com o qual deseja continuar. Se não houver uma assinatura ativa, a próxima etapa será o faturamento. O painel só será aberto após um faturamento concluído com sucesso.",
        currentStateLabel: "Estado atual",
      },
      summary: {
        previewMode: "Os serviços estão em modo de pré-visualização",
        selectedPlanOnly: "Plano {planLabel}",
        selectedPlanWithStatus: "Plano {planLabel} • {statusLabel}",
        activePlanWithStatus: "Plano ativo: {activePlanLabel} • {statusLabel}",
        billingCompleted: "faturamento concluído",
        billingPending: "faturamento pendente",
        planChangePending: "o faturamento é necessário para alterar o plano",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "O perfil do proprietário é obrigatório",
          message:
            "Para usar os serviços, primeiro é necessário inserir os dados do proprietário. Até que o perfil seja concluído, o faturamento e o painel permanecerão bloqueados.",
          cta: "Ir para a página do perfil",
        },
        phoneVerificationRequired: {
          title: "A verificação do telefone é obrigatória",
          message:
            "O perfil foi salvo, mas o telefone deve ser verificado com OTP. Até que a verificação do telefone seja concluída, a seleção de serviço permanecerá em modo de pré-visualização e o faturamento / painel ficarão bloqueados.",
          cta: "Ir para o perfil e concluir a verificação",
        },
      },
      plans: {
        stepLabel: "Etapa 1",
        title: "Escolha um plano",
        activeDescription:
          "A seleção do plano só fica ativa após a conclusão do perfil e da verificação do telefone.",
        lockedDescription:
          "Os cartões de plano estão atualmente apenas para pré-visualização. Você não pode continuar até que o perfil e a verificação do telefone sejam concluídos.",
        standard: {
          label: "Padrão",
          badge: "Plano mensal",
          description:
            "Uma opção simples e estável para o fluxo principal do proprietário.",
          helper: "Os anúncios são mostrados na ordem padrão.",
        },
        plus: {
          label: "Plus",
          badge: "Visibilidade prioritária",
          description:
            "Maior visibilidade dentro da mesma categoria e dos mesmos filtros.",
          helper: "Os anúncios Plus são mostrados antes dos anúncios padrão.",
        },
        selectedChip: "Selecionado",
        lockedNote:
          "A seleção do plano fica bloqueada até a conclusão do perfil",
      },
      serviceList: {
        stepLabel: "Etapa 2",
        title: "Escolha um serviço",
        activeDescription:
          "Depois de selecionar um serviço, a próxima etapa será o faturamento. Para serviços com assinatura ativa, o acesso direto ao painel fica disponível apenas para esse plano ativo.",
        lockedDescription:
          "Até que o onboarding do proprietário seja concluído, a seleção de serviço permanecerá em modo de pré-visualização e a continuação ficará bloqueada.",
        carouselAria: "Navegar entre serviços",
        previousServices: "Serviços anteriores",
        nextServices: "Próximos serviços",
        loadingServices:
          "Não foi possível carregar os serviços temporariamente. Tente novamente mais tarde.",
        requestTimeout:
          "A solicitação expirou. O backend não respondeu.",
        noServices: "Nenhum serviço foi encontrado.",
        profileCompletionInfo:
          "A seleção de serviço ficará ativa aqui após a conclusão do perfil e da verificação do telefone.",
      },
      badges: {
        activeSubscription: "Assinatura ativa",
        continueWithPlus: "Continuar com Plus",
        continueWithStandard: "Continuar com Padrão",
        selected: "Selecionado",
        activePlanLabel: "Plano ativo",
        changePlanBadge: "Alteração de plano",
      },
      meta: {
        planLabel: "Plano",
        priceLabel: "Preço",
        priceInactive: "O preço não está ativo",
      },
      cards: {
        fallbackDescription:
          "O fluxo do proprietário para este serviço está ativo e você pode prosseguir para a próxima etapa.",
        lockedFooter:
          "Você não pode continuar com este serviço até que o perfil e a verificação do telefone sejam concluídos",
        activeFooterFallback: "Há uma assinatura ativa disponível",
        activeFooterWithDate: "Ativo até • {paidUntil}",
        billingFooter:
          "Depois de selecionar este serviço, a próxima etapa será o faturamento",
        planChangeFooter:
          "O faturamento é necessário para o plano selecionado",
        planChangeFooterWithActivePlan:
          "Plano ativo: {activePlanLabel} • O faturamento é necessário para o plano selecionado",
        titleFallback: "Serviço",
      },
      selection: {
        flowLabel: "Fluxo selecionado",
        notSelected: "Nenhum serviço selecionado",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Para continuar, primeiro escolha um serviço acima.",
        billingCompletedFlow:
          "Uma assinatura ativa está visível para o plano selecionado deste serviço. O faturamento já foi concluído, e continuar abrirá o painel.",
        billingPendingFlow:
          "O serviço foi selecionado. A próxima etapa é o faturamento. O painel não ficará ativo até que o pagamento seja concluído com sucesso.",
        planChangeMessage:
          "Você atualmente tem uma assinatura ativa do plano {activePlanLabel}. Se atualizar a assinatura para o plano {targetPlanLabel}, o plano ativo anterior será cancelado e o plano {targetPlanLabel} será ativado pelos próximos 30 dias.",
        resetService: "Redefinir serviço",
        chooseServiceButton: "Escolher serviço",
        changePlanButton: "Ir para o faturamento e atualizar o plano",
        goToProfile: "Ir para a página do perfil",
        goToDashboard: "Ir para o painel",
        goToBilling: "Ir para o faturamento",
        redirecting: "Redirecionando...",
      },
      status: {
        profileRequired: "Perfil obrigatório",
        phoneRequired: "Verificação do telefone pendente",
        active: "Ativo",
        billingRequired: "Faturamento obrigatório",
        serviceSelection: "Seleção de serviço",
        planChangeRequired: "Alteração de plano obrigatória",
      },
      errors: {
        ownerNotFoundLoadError: "O perfil do proprietário não foi encontrado.",
        servicesLoadErrorFallback: "Não foi possível carregar os serviços",
        servicesLoadErrorWithStatus:
          "Não foi possível carregar os serviços (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;