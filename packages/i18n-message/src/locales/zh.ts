import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const zhMessages = {
  common: {
    brand: {
      homeAriaLabel: "主页",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "语言选择",
      selectorMenuAriaLabel: "语言选择菜单",
      currentLocaleTitle: "当前语言：{language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "业主管理面板",
        checkingContext: "正在检查服务上下文...",
        subtitle:
          "只有在完成业主入驻流程和订阅流程后，管理面板才会开放。当前服务、计划和访问状态显示如下。",
      },
      summary: {
        activeServiceLabel: "当前服务",
        ownerLabel: "业主",
        paidUntilLabel: "有效期至",
        loadingStatus: "正在检查状态...",
        activeServiceFallback: "未找到当前服务",
        serviceGenericLabel: "服务",
      },
      notes: {
        loading: "正在检查状态...",
        active:
          "说明：管理面板链接会使用当前选定的服务上下文。创建、编辑和删除房源的流程统一在“我的房源”部分内处理。",
        locked:
          "说明：当前阶段管理面板被有意锁定。下一步请使用上方的操作按钮。",
      },
      errors: {
        prefix: "错误",
        dashboardStateLoadFailed: "无法加载管理面板状态。",
        completeOwnerProfileFirst: "请先完成业主资料。",
        phoneVerificationRequired: "必须完成手机验证。",
        serviceSelectionRequired: "必须先完成服务选择。",
        activeSubscriptionNotFound: "未找到有效订阅。",
        serviceNotFoundOrInactive: "未找到服务或服务未激活。",
        serverErrorOccurred: "服务器发生错误。请稍后重试。",
        ownerIdentityRequired: "请先完成业主资料。",
      },
      cards: {
        properties: {
          title: "我的房源",
          text: "查看所有房源、创建新房源、编辑活动房源并删除房源。",
        },
        profile: {
          title: "资料信息",
          text: "管理姓名、电话和其他资料信息。",
        },
        billing: {
          title: "订阅与支付",
          text: "检查状态并进入支付流程。",
        },
        bookings: {
          title: "预订请求",
          text: "批准或拒绝收到的请求。",
        },
        lockedChip: "已锁定",
        lockedDescriptions: {
          profile:
            "此部分在管理面板中保持锁定。请使用上方操作按钮打开资料页面。",
          billing:
            "在此阶段，订阅部分通过操作按钮打开。管理面板中的卡片仍保持锁定。",
          properties:
            "只有在完成业主入驻流程和订阅后，才能创建、编辑和删除房源。",
          default:
            "在完成业主入驻流程和订阅之前，此部分不可用。",
        },
      },
      states: {
        profileRequired: {
          badge: "管理面板已锁定",
          title: "必须完成业主资料",
          description:
            "要使用服务，首先必须填写业主信息。在资料完成之前，管理面板、计费和其他部分都不会开放。",
          cta: "前往资料页面",
        },
        phoneVerificationRequired: {
          badge: "需要 OTP 验证",
          title: "手机尚未验证",
          description:
            "资料已作为草稿创建，但在通过 OTP 验证手机之前，业主不会被视为已激活。管理面板和其他功能将继续锁定。",
          cta: "前往资料并完成验证",
        },
        serviceSelectionRequired: {
          badge: "需要选择服务",
          title: "请先完成服务步骤",
          description:
            "完成资料后，业主必须先返回服务页面。在此阶段管理面板仍保持锁定。",
          cta: "前往服务页面",
        },
        subscriptionRequired: {
          badge: "需要订阅",
          title: "没有有效订阅",
          description:
            "服务已选择，但支付尚未完成，或订阅未激活。管理面板将保持锁定，其他流程也会被阻止。",
          cta: "前往订阅页面",
        },
        active: {
          badge: "已激活",
          title: "管理面板已开放",
          description:
            "订阅已激活。业主可以创建房源、管理房源、处理预订请求，并完整使用系统。",
          cta: "查看服务",
        },
      },
      meta: {
        serviceCodeLabel: "服务代码",
        planLabel: "方案",
        accessLabel: "访问状态",
        planStandardLabel: "标准版",
        planPlusLabel: "高级版",
        accessActiveLabel: "已开放",
        accessLockedLabel: "已锁定",
      },
      services: {
        RENT_HOME: "住房租赁",
        BARBER: "理发服务",
        CAR_RENTAL: "汽车租赁",
        HOTEL: "酒店",
        BEAUTY_SALON: "美容沙龙",
        BABYSITTER: "保姆服务",
        CLEANING: "清洁服务",
        TECHNICAL_SERVICES: "技术服务",
      },
    },
    services: {
      hero: {
        pageTitle: "服务选择",
        lockedDescription:
          "此页面是业主入驻流程的入口。在资料和手机验证完成之前，服务流程、计费和管理面板都会被锁定。",
        activeDescription:
          "请先选择方案，然后选择要继续的服务。如果没有有效订阅，下一步就是计费。只有在成功支付后管理面板才会开放。",
        currentStateLabel: "当前状态",
      },
      summary: {
        previewMode: "服务处于预览模式",
        selectedPlanOnly: "{planLabel}方案",
        selectedPlanWithStatus: "{planLabel}方案 • {statusLabel}",
        activePlanWithStatus: "当前有效方案：{activePlanLabel} • {statusLabel}",
        billingCompleted: "计费已完成",
        billingPending: "等待计费",
        planChangePending: "变更方案需要计费",
      },
      gate: {
        onboardingLabel: "入驻流程",
        profileRequired: {
          title: "需要业主资料",
          message:
            "要使用服务，必须先填写业主资料。在资料完成之前，计费和管理面板都会保持锁定。",
          cta: "前往资料页面",
        },
        phoneVerificationRequired: {
          title: "需要手机验证",
          message:
            "资料已保存，但手机仍需通过 OTP 完成验证。在手机验证完成之前，服务选择保持预览模式，计费 / 管理面板将继续锁定。",
          cta: "前往资料并完成验证",
        },
      },
      plans: {
        stepLabel: "第 1 步",
        title: "选择方案",
        activeDescription: "只有在资料和手机验证完成后，方案选择才会激活。",
        lockedDescription:
          "当前方案卡片仅用于预览。在资料和手机验证完成之前无法继续。",
        standard: {
          label: "标准版",
          badge: "月度方案",
          description: "适用于核心业主流程的简单稳定选择。",
          helper: "列表将按标准顺序显示。",
        },
        plus: {
          label: "高级版",
          badge: "优先曝光",
          description: "在相同分类和筛选条件下获得更高曝光。",
          helper: "高级版列表会排在标准版列表之前。",
        },
        selectedChip: "已选择",
        lockedNote: "资料完成之前方案选择已锁定",
      },
      serviceList: {
        stepLabel: "第 2 步",
        title: "选择服务",
        activeDescription:
          "选择服务后，下一步是计费。若该服务已有有效订阅，则仅对该有效方案开放管理面板入口。",
        lockedDescription:
          "在业主入驻流程完成之前，服务选择保持预览模式，无法继续。",
        carouselAria: "在服务之间切换",
        previousServices: "上一个服务",
        nextServices: "下一个服务",
        loadingServices: "服务暂时无法加载，请稍后再试。",
        requestTimeout: "请求超时，后端未响应。",
        noServices: "未找到任何服务。",
        profileCompletionInfo:
          "在资料和手机验证完成后，此处将激活服务选择。",
      },
      badges: {
        activeSubscription: "有效订阅",
        continueWithPlus: "以高级版继续",
        continueWithStandard: "以标准版继续",
        selected: "已选择",
        activePlanLabel: "当前有效方案",
        changePlanBadge: "方案变更",
      },
      meta: {
        planLabel: "方案",
        priceLabel: "价格",
        priceInactive: "价格未启用",
      },
      cards: {
        fallbackDescription:
          "该服务的业主流程已激活，你可以继续进入下一阶段。",
        lockedFooter: "在资料和手机验证完成之前，无法继续此服务",
        activeFooterFallback: "存在有效订阅",
        activeFooterWithDate: "有效期至 • {paidUntil}",
        billingFooter: "选择此服务后，下一步将进入计费",
        planChangeFooter: "所选方案需要重新计费",
        planChangeFooterWithActivePlan:
          "当前有效方案：{activePlanLabel} • 所选方案需要重新计费",
        titleFallback: "服务",
      },
      selection: {
        flowLabel: "当前流程",
        notSelected: "尚未选择服务",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst: "继续之前，请先在上方选择服务。",
        billingCompletedFlow:
          "此服务在所选方案下已存在有效订阅。计费已完成，继续后将开放管理面板。",
        billingPendingFlow:
          "服务已选择。下一步是计费。在支付成功之前，管理面板不会被激活。",
        planChangeMessage:
          "您当前已有 {activePlanLabel} 方案的有效订阅。如果您将订阅更新为 {targetPlanLabel} 方案，之前的有效方案将被取消，新的 {targetPlanLabel} 方案将自动激活 30 天。",
        resetService: "重置服务",
        chooseServiceButton: "选择服务",
        changePlanButton: "前往计费并更新方案",
        goToProfile: "前往资料页面",
        goToDashboard: "前往管理面板",
        goToBilling: "前往计费",
        redirecting: "正在跳转...",
      },
      status: {
        profileRequired: "需要资料",
        phoneRequired: "等待手机验证",
        active: "有效",
        billingRequired: "需要计费",
        serviceSelection: "服务选择",
        planChangeRequired: "需要变更方案",
      },
      errors: {
        ownerNotFoundLoadError: "未找到业主资料。",
        servicesLoadErrorFallback: "服务无法加载",
        servicesLoadErrorWithStatus: "服务无法加载（HTTP {status}）",
      },
    },
  },
} as const satisfies AppMessagesCatalog;