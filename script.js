(() => {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hasGsap = typeof window.gsap !== "undefined";
    const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
    let lenis = null;
    let toastTimer = null;

    const qs = (selector, scope = document) => scope.querySelector(selector);
    const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

    function syncPageLock() {
        const menuOpen = qs("#mobileMenu")?.classList.contains("open");
        const dialogOpen = qsa("dialog").some((dialog) => dialog.open);
        document.body.style.overflow = menuOpen || dialogOpen ? "hidden" : "";
        if (menuOpen || dialogOpen) {
            lenis?.stop();
        } else {
            lenis?.start();
        }
    }

    function scrollToElement(target) {
        if (!target) return;
        if (lenis) {
            lenis.scrollTo(target, { offset: -76, duration: reducedMotion ? 0 : 1.05 });
        } else {
            target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        }
    }

    function initMotionEngine() {
        if (!hasGsap) return;
        if (hasScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
        if (window.TextPlugin) window.gsap.registerPlugin(window.TextPlugin);

        if (typeof window.Lenis !== "undefined" && hasScrollTrigger) {
            try {
                lenis = new window.Lenis({ lerp: 1, smoothWheel: false, wheelMultiplier: 1 });
                lenis.on("scroll", window.ScrollTrigger.update);
                window.gsap.ticker.add((time) => lenis.raf(time * 1000));
                window.gsap.ticker.lagSmoothing(0);
            } catch (_) {
                lenis = null;
            }
        }
    }

    function initNavigation() {
        const header = qs("#siteHeader");
        const menuToggle = qs("#menuToggle");
        const mobileMenu = qs("#mobileMenu");
        const curtain = qs("#navCurtain");
        const curtainLabel = qs("#navCurtainLabel");
        let curtainTimer;

        const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 24);
        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });

        function setMenu(open) {
            if (!menuToggle || !mobileMenu) return;
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
            mobileMenu.classList.toggle("open", open);
            mobileMenu.setAttribute("aria-hidden", String(!open));
            syncPageLock();
            if (open) qs(".mob-link", mobileMenu)?.focus();
        }

        menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));

        qsa('a[href^="#"]').forEach((link) => {
            link.addEventListener("click", (event) => {
                if (link.classList.contains("skip-link")) return;
                const id = link.getAttribute("href");
                const target = id && id.length > 1 ? qs(id) : null;
                if (!target) return;
                event.preventDefault();
                setMenu(false);

                const closeParentDialog = link.closest("dialog");
                if (closeParentDialog?.open) closeParentDialog.close();

                const useCurtain = !reducedMotion && link.matches(".nav-link, .mob-link") && curtain;
                window.clearTimeout(curtainTimer);
                if (useCurtain) {
                    curtainLabel.textContent = link.dataset.sectionName || target.id;
                    curtain.classList.add("active");
                    curtainTimer = window.setTimeout(() => {
                        scrollToElement(target);
                        curtainTimer = window.setTimeout(() => curtain.classList.remove("active"), 360);
                    }, 310);
                } else {
                    scrollToElement(target);
                }

                if (window.location.hash !== id) history.pushState(null, "", id);
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && mobileMenu?.classList.contains("open")) {
                setMenu(false);
                menuToggle?.focus();
            }
        });
    }

    function showToast(message) {
        const toast = qs("#toast");
        if (!toast) return;
        qs("span", toast).textContent = message;
        toast.classList.add("visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2800);
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Copy command failed");
    }

    function initRecruiterTools() {
        const tools = qs("#recruiterTools");
        const toggle = qs("#recruiterToggle");
        const panel = qs("#recruiterPanel");
        const close = qs("#recruiterClose");
        const copyButton = qs("#copySummary");
        if (!tools || !toggle || !panel) return;

        const summary = [
            "Азат Ибрагимов — системный администратор / Junior+ DevOps.",
            "Уфа: офис, гибрид или удаленно; без переезда, командировки возможны.",
            "Production L1–L2 с января 2026: серверы, AD, сети, бэкапы и 50+ ПК.",
            "Стек: Linux, Docker/Swarm, GitLab CI/CD, Prometheus, Grafana, Loki, Bash, Python, PostgreSQL.",
            "Сократил простой при миграции инфраструктуры на 70–80%.",
            "Сэкономил 230+ тыс. ₽ на модульном ремонте; диагностика стала быстрее на 40%; NPS 100%.",
            "Школа 21: проекты Observability Stack, GitLab CI/CD и Linux Network.",
            "Сильные стороны: документация, траблшутинг, стрессоустойчивость и понятная коммуникация.",
            "GitHub: https://github.com/flagminn/devops-portfolio",
            "Telegram: @flagminn · aazat.ibragimov@gmail.com · +7 (996) 102-03-31"
        ].join("\n");

        function setPanel(open) {
            toggle.setAttribute("aria-expanded", String(open));
            panel.classList.toggle("open", open);
            panel.setAttribute("aria-hidden", String(!open));
            if (open) close?.focus();
        }

        toggle.addEventListener("click", () => setPanel(toggle.getAttribute("aria-expanded") !== "true"));
        close?.addEventListener("click", () => {
            setPanel(false);
            toggle.focus();
        });

        document.addEventListener("pointerdown", (event) => {
            if (toggle.getAttribute("aria-expanded") === "true" && !tools.contains(event.target)) setPanel(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setPanel(false);
                toggle.focus();
            }
        });

        copyButton?.addEventListener("click", async () => {
            try {
                await copyText(summary);
                showToast("Саммари скопировано — можно отправлять тимлиду");
            } catch (_) {
                showToast("Не удалось скопировать. Разрешите доступ к буферу обмена");
            }
        });
    }

    function setupRovingTabs(buttons, activate) {
        buttons.forEach((button, index) => {
            button.addEventListener("keydown", (event) => {
                if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                let nextIndex = index;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % buttons.length;
                if (event.key === "ArrowLeft") nextIndex = (index - 1 + buttons.length) % buttons.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = buttons.length - 1;
                activate(nextIndex, true);
            });
        });
    }

    function initExperience() {
        const buttons = qsa(".timeline-point");
        const panels = qsa("[data-experience-panel]");
        const counter = qs("#experienceCounter");
        const nav = qs("#timelineNav");
        let activeIndex = 0;

        function activateCareerTab(article, tabName, focus = false) {
            const tabs = qsa("[data-career-tab]", article);
            const panes = qsa("[data-career-pane]", article);
            tabs.forEach((tab) => {
                const active = tab.dataset.careerTab === tabName;
                tab.classList.toggle("active", active);
                tab.setAttribute("aria-selected", String(active));
                tab.tabIndex = active ? 0 : -1;
                if (active && focus) tab.focus();
            });
            panes.forEach((pane) => { pane.hidden = pane.dataset.careerPane !== tabName; });
        }

        function showExperience(index, focus = false) {
            activeIndex = (index + buttons.length) % buttons.length;
            buttons.forEach((button, buttonIndex) => {
                const active = buttonIndex === activeIndex;
                button.classList.toggle("active", active);
                button.setAttribute("aria-selected", String(active));
                button.tabIndex = active ? 0 : -1;
                if (active && focus) button.focus();
            });
            panels.forEach((panel) => { panel.hidden = panel.dataset.experiencePanel !== buttons[activeIndex].dataset.experience; });
            if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(buttons.length).padStart(2, "0")}`;

            const activeButton = buttons[activeIndex];
            if (nav && activeButton.offsetLeft < nav.scrollLeft || nav && activeButton.offsetLeft + activeButton.offsetWidth > nav.scrollLeft + nav.clientWidth) {
                nav.scrollTo({ left: activeButton.offsetLeft - nav.clientWidth / 2 + activeButton.clientWidth / 2, behavior: reducedMotion ? "auto" : "smooth" });
            }

            const activePanel = panels.find((panel) => !panel.hidden);
            if (activePanel && hasGsap && !reducedMotion) {
                window.gsap.fromTo(activePanel, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "opacity,transform" });
            }
        }

        buttons.forEach((button, index) => button.addEventListener("click", () => showExperience(index)));
        setupRovingTabs(buttons, showExperience);
        qs("#experiencePrev")?.addEventListener("click", () => showExperience(activeIndex - 1));
        qs("#experienceNext")?.addEventListener("click", () => showExperience(activeIndex + 1));

        panels.forEach((article) => {
            const tabs = qsa("[data-career-tab]", article);
            tabs.forEach((tab) => tab.addEventListener("click", () => activateCareerTab(article, tab.dataset.careerTab)));
            setupRovingTabs(tabs, (index, focus) => activateCareerTab(article, tabs[index].dataset.careerTab, focus));
        });
    }

    const skills = {
        virtualbox: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "VirtualBox & Ubuntu Server LTS",
            description: "Развернул виртуальную машину с Ubuntu 20.04 Server LTS в VirtualBox, проверил версию ОС через cat /etc/issue.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Развернул виртуальную машину с Ubuntu 20.04 Server LTS в VirtualBox, проверил версию ОС через cat /etc/issue."],
            github: "DO/01-linux-administration"
        },
        users_mgmt: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Linux User & Group Management",
            description: "Создал пользователя, добавил его в группу adm, настроил права sudo и проверил записи в /etc/passwd.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Создал пользователя, добавил его в группу adm, настроил права sudo и проверил записи в /etc/passwd."],
            github: "DO/01-linux-administration"
        },
        hostname_tz: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Hostname & Timezone Configuration",
            description: "Установил системное имя хоста в формате user-1 и настроил актуальную временную зону ОС.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Установил системное имя хоста в формате user-1 и настроил актуальную временную зону ОС."],
            github: "DO/01-linux-administration"
        },
        ntp: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "NTP & System Time Synchronization",
            description: "Настроил службу автоматической синхронизации времени (NTP) для поддержания актуального системного времени.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Настроил службу автоматической синхронизации времени (NTP) для поддержания актуального системного времени."],
            github: "DO/01-linux-administration"
        },
        editors: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Console Text Editors (VIM, Nano, Mcedit)",
            description: "Установил и освоил VIM, Nano и Mcedit, выполнил редактирование файлов, поиск и замену ключевых слов.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Установил и освоил VIM, Nano и Mcedit, выполнил редактирование файлов, поиск и замену ключевых слов."],
            github: "DO/01-linux-administration"
        },
        ssh_hardening: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "SSH Daemon Hardening & Port Reassignment",
            description: "Установил и настроил службу SSHd, изменил стандартный порт на 2022, добавил в автозагрузку и проверил процесс через ps.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Установил и настроил службу SSHd, изменил стандартный порт на 2022, добавил в автозагрузку и проверил процесс через ps."],
            github: "DO/01-linux-administration"
        },
        top_htop: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Resource Monitoring (top & htop)",
            description: "Использовал top и htop для мониторинга uptime, активных процессов, сортировки по CPU/RAM/PID и фильтрации.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Использовал top и htop для мониторинга uptime, активных процессов, сортировки по CPU/RAM/PID и фильтрации."],
            github: "DO/01-linux-administration"
        },
        disk_mgmt: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Disk Management (fdisk & df)",
            description: "Исследовал структуру дисков через fdisk -l, проанализировал использование разделов и типов файловых систем через df -Th.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Исследовал структуру дисков через fdisk -l, проанализировал использование разделов и типов файловых систем через df -Th."],
            github: "DO/01-linux-administration"
        },
        du_ncdu: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Directory Sizing (du & ncdu)",
            description: "Измерил размер директорий /home, /var, /var/log с помощью утилит du и интерактивного анализатора ncdu.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Измерил размер директорий /home, /var, /var/log с помощью утилит du и интерактивного анализатора ncdu."],
            github: "DO/01-linux-administration"
        },
        sys_logs: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "System Logs Analysis",
            description: "Исследовал системные журналы /var/log/dmesg, /var/log/syslog и /var/log/auth.log для аудита авторизации и служб.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Исследовал системные журналы /var/log/dmesg, /var/log/syslog и /var/log/auth.log для аудита авторизации и служб."],
            github: "DO/01-linux-administration"
        },
        cron: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Task Scheduling (CRON)",
            description: "Настроил периодический запуск команды uptime через планировщик задач CRON с интервалом в 2 минуты и проверил логи.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Настроил периодический запуск команды uptime через планировщик задач CRON с интервалом в 2 минуты и проверил логи."],
            github: "DO/01-linux-administration"
        },
        ssh_tunnel: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "SSH Tunneling (Port Forwarding)",
            description: "Изучил и применил механизмы Local и Remote Port Forwarding для безопасного проброса портов через SSH-туннели.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Изучил и применил механизмы Local и Remote Port Forwarding для безопасного проброса портов через SSH-туннели."],
            github: "DO/02-linux-networks"
        },
        ansicolor: {
            category: "DO / 03-LINUX-MONITORING-V1",
            title: "ANSI Color Formatting & Configs",
            description: "Реализовал кастомизацию цветового оформления вывода метрик через ANSI escape-последовательности и внешний конфиг.",
            evidence: ["Реализовано в проекте: DO / 03-linux-monitoring-v1", "Реализовал кастомизацию цветового оформления вывода метрик через ANSI escape-последовательности и внешний конфиг."],
            github: "DO/03-linux-monitoring-v1"
        },
        fs_analysis: {
            category: "DO / 03-LINUX-MONITORING-V1",
            title: "Filesystem Analysis & Top Dirs",
            description: "Написал скрипт подсчета папок, файлов по типам, поиска топ-5 папок и топ-10 файлов по размеру с замером времени выполнения.",
            evidence: ["Реализовано в проекте: DO / 03-linux-monitoring-v1", "Написал скрипт подсчета папок, файлов по типам, поиска топ-5 папок и топ-10 файлов по размеру с замером времени выполнения."],
            github: "DO/03-linux-monitoring-v1"
        },
        file_gen: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "Automated File Generator Script",
            description: "Создал Bash-скрипт для генерации файлов заданного размера, имени и суффикса с контролем заполнения диска (df).",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Создал Bash-скрипт для генерации файлов заданного размера, имени и суффикса с контролем заполнения диска (df)."],
            github: "DO/04-linux-monitoring-v2"
        },
        fs_cleanup: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "Filesystem Cleanup Automation",
            description: "Разработал скрипт очистки сгенерированных файлов по дате создания, маске и логам генерации.",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Разработал скрипт очистки сгенерированных файлов по дате создания, маске и логам генерации."],
            github: "DO/04-linux-monitoring-v2"
        },
        web_log_gen: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "Web Server Log Generator",
            description: "Написал генератор логов веб-сервера со случайными IP, статусами ответа (200, 401, 403, 404, 500 и др.) и User-Agent.",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Написал генератор логов веб-сервера со случайными IP, статусами ответа (200, 401, 403, 404, 500 и др.) и User-Agent."],
            github: "DO/04-linux-monitoring-v2"
        },
        goaccess: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "Web Analytics (GoAccess)",
            description: "Установил и настроил анализатор логов GoAccess для интерактивного анализа трафика и генерации HTML-отчетов.",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Установил и настроил анализатор логов GoAccess для интерактивного анализа трафика и генерации HTML-отчетов."],
            github: "DO/04-linux-monitoring-v2"
        },
        stress: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "System Stress Testing (stress)",
            description: "Провел нагрузочное тестирование ОС с помощью утилиты stress (CPU, RAM, диск) с отслеживанием графиков в Grafana.",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Провел нагрузочное тестирование ОС с помощью утилиты stress (CPU, RAM, диск) с отслеживанием графиков в Grafana."],
            github: "DO/04-linux-monitoring-v2"
        },
        custom_exporter: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "Custom Prometheus Exporter",
            description: "Разработал легковесный кастомный скрипт-экспортер метрик для интеграции с Prometheus.",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Разработал легковесный кастомный скрипт-экспортер метрик для интеграции с Prometheus."],
            github: "DO/04-linux-monitoring-v2"
        },
        swarm: {
            category: "DO / 07-DOCKER-COMPOSE",
            title: "Docker Swarm Clustering",
            description: "Объединил виртуальные машины в кластер Docker Swarm (Manager/Worker) для оркестрации и репликации сервисов.",
            evidence: ["Реализовано в проекте: DO / 07-docker-compose", "Объединил виртуальные машины в кластер Docker Swarm (Manager/Worker) для оркестрации и репликации сервисов."],
            github: "DO/07-docker-compose"
        },
        cadvisor: {
            category: "DO / 08-MONITORING-ALERTING",
            title: "cAdvisor & Loki Log Aggregation",
            description: "Настроил сбор контейнерных метрик через cAdvisor и агрегацию логов с помощью Grafana Loki.",
            evidence: ["Реализовано в проекте: DO / 08-monitoring-alerting", "Настроил сбор контейнерных метрик через cAdvisor и агрегацию логов с помощью Grafana Loki."],
            github: "DO/08-monitoring-alerting"
        },
        linux: {
            category: "DO / 01-LINUX-ADMINISTRATION",
            title: "Linux System Administration",
            description: "Изучил базовую системную архитектуру Linux, структуру файловой системы, управление правами доступа и пользователями, а также диагностику состояния ОС.",
            evidence: ["Реализовано в проекте: DO / 01-linux-administration", "Изучена базовая системная архитектура Linux, структура файловой системы, управление правами доступа и пользователями, а также диагностику состояния ОС."],
            github: "DO/01-linux-administration"
        },
        networks: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "Linux Networking & Netplan",
            description: "Настроил статическую IP-адресацию, шлюзы и сетевые интерфейсы в Netplan, проверил связность хостов и маршрутизацию.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Настроил статическую IP-адресацию, шлюзы и сетевые интерфейсы в Netplan, проверил связность хостов и маршрутизацию."],
            github: "DO/02-linux-networks"
        },
        subnetting: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "IP Subnetting & CIDR",
            description: "Выполнил расчет подсетей, масок и маппинг сетевых интерфейсов для виртуальных машин.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Выполнил расчет подсетей, масок и маппинг сетевых интерфейсов для виртуальных машин."],
            github: "DO/02-linux-networks"
        },
        iptables: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "Traffic Filtering & iptables",
            description: "Сконфигурировал правила фильтрации пакетов и политику безопасности DROP в iptables для ограничения несанкционированного сетевого доступа.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Сконфигурировал правила фильтрации пакетов и политику безопасности DROP в iptables для ограничения несанкционированного сетевого доступа."],
            github: "DO/02-linux-networks"
        },
        routing: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "Static Routing & ip route",
            description: "Настроил статическую маршрутизацию между подсетями и проверил пути прохождения пакетов через traceroute / ip route.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Настроил статическую маршрутизацию между подсетями и проверил пути прохождения пакетов через traceroute / ip route."],
            github: "DO/02-linux-networks"
        },
        dhcp: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "DHCP Server Configuration",
            description: "Установил и настроил DHCP-сервер (isc-dhcp-server), выделил пулы динамических адресов и зарезервировал IP по MAC-адресам.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Установил и настроил DHCP-сервер (isc-dhcp-server), выделил пулы динамических адресов и зарезервировал IP по MAC-адресам."],
            github: "DO/02-linux-networks"
        },
        services: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "Network Services (DNS, FTP, SSH)",
            description: "Развернул и настроил DNS (BIND9), FTP-сервер (vsftpd) и защищенный доступ по SSH с ограничением прав.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Развернул и настроил DNS (BIND9), FTP-сервер (vsftpd) и защищенный доступ по SSH с ограничением прав."],
            github: "DO/02-linux-networks"
        },
        iperf: {
            category: "DO / 02-LINUX-NETWORKS",
            title: "Network Performance (iperf3)",
            description: "Провел нагрузочное тестирование и замер пропускной способности каналов связи с помощью утилиты iperf3.",
            evidence: ["Реализовано в проекте: DO / 02-linux-networks", "Провел нагрузочное тестирование и замер пропускной способности каналов связи с помощью утилиты iperf3."],
            github: "DO/02-linux-networks"
        },
        bash_metrics: {
            category: "DO / 03-LINUX-MONITORING-V1",
            title: "Bash Scripting & System Metrics",
            description: "Написал комплекс Bash-скриптов для сбора и вывода системных метрик: аптайм, загрузка CPU, использование RAM и дискового пространства, сетевые интерфейсы.",
            evidence: ["Реализовано в проекте: DO / 03-linux-monitoring-v1", "Написал комплекс Bash-скриптов для сбора и вывода системных метрик: аптайм, загрузка CPU, использование RAM и дискового пространства, сетевые интерфейсы."],
            github: "DO/03-linux-monitoring-v1"
        },
        adv_bash: {
            category: "DO / 04-LINUX-MONITORING-V2",
            title: "Advanced Bash Scripting",
            description: "Разработал расширенные Bash-скрипты мониторинга с парсингом системных логов, генерацией отчетов в заданном формате и обработкой ошибок ввода-вывода.",
            evidence: ["Реализовано в проекте: DO / 04-linux-monitoring-v2", "Разработал расширенные Bash-скрипты мониторинга с парсингом системных логов, генерацией отчетов в заданном формате и обработкой ошибок ввода-вывода."],
            github: "DO/04-linux-monitoring-v2"
        },
        docker_cont: {
            category: "DO / 05-SIMPLE-DOCKER",
            title: "Docker & Containerization",
            description: "Написал многоэтапный Dockerfile для сборки кастомного веб-приложения на мини-сервере, настроил запуск и изоляцию контейнеров.",
            evidence: ["Реализовано в проекте: DO / 05-simple-docker", "Написал многоэтапный Dockerfile для сборки кастомного веб-приложения на мини-сервере, настроил запуск и изоляцию контейнеров."],
            github: "DO/05-simple-docker"
        },
        nginx_proxy: {
            category: "DO / 05-SIMPLE-DOCKER",
            title: "Nginx Reverse Proxy",
            description: "Настроил веб-сервер Nginx внутри контейнера в качестве обратного прокси (reverse proxy) для проксирования запросов на бэкенд.",
            evidence: ["Реализовано в проекте: DO / 05-simple-docker", "Настроил веб-сервер Nginx внутри контейнера в качестве обратного прокси (reverse proxy) для проксирования запросов на бэкенд."],
            github: "DO/05-simple-docker"
        },
        dockle: {
            category: "DO / 05-SIMPLE-DOCKER",
            title: "Docker Security (Dockle)",
            description: "Провел сканирование образов на уязвимости и соответствие стандартам безопасности с помощью линтера Dockle.",
            evidence: ["Реализовано в проекте: DO / 05-simple-docker", "Провел сканирование образов на уязвимости и соответствие стандартам безопасности с помощью линтера Dockle."],
            github: "DO/05-simple-docker"
        },
        gitlab_ci: {
            category: "DO / 06-CI-CD",
            title: "GitLab CI/CD Pipelines",
            description: "Сконфигурировал автоматизированный пайплайн в .gitlab-ci.yml со стадиями сборки (build), тестирования (test), линтинга (style) и деплоя (deploy).",
            evidence: ["Реализовано в проекте: DO / 06-ci-cd", "Сконфигурировал автоматизированный пайплайн в .gitlab-ci.yml со стадиями сборки (build), тестирования (test), линтинга (style) и деплоя (deploy)."],
            github: "DO/06-ci-cd"
        },
        clang: {
            category: "DO / 06-CI-CD",
            title: "Code Style & Linters (clang-format)",
            description: "Интегрировал проверку стиля кода через clang-format и статический анализ на этапе CI.",
            evidence: ["Реализовано в проекте: DO / 06-ci-cd", "Интегрировал проверку стиля кода через clang-format и статический анализ на этапе CI."],
            github: "DO/06-ci-cd"
        },
        telegram_bot: {
            category: "DO / 06-CI-CD",
            title: "Automated Notifications (Bash / Telegram API)",
            description: "Реализовал скрипт отправки уведомлений о статусе сборки пайплайна в Telegram-чат через Telegram Bot API.",
            evidence: ["Реализовано в проекте: DO / 06-ci-cd", "Реализовал скрипт отправки уведомлений о статусе сборки пайплайна в Telegram-чат через Telegram Bot API."],
            github: "DO/06-ci-cd"
        },
        docker_compose: {
            category: "DO / 07-DOCKER-COMPOSE",
            title: "Docker Compose & Multi-Container Apps",
            description: "Спроектировал многоконтейнерную архитектуру в docker-compose.yml, объединив веб-сервер Nginx, бэкенд-сервис и базы данных.",
            evidence: ["Реализовано в проекте: DO / 07-docker-compose", "Спроектировал многоконтейнерную архитектуру в docker-compose.yml, объединив веб-сервер Nginx, бэкенд-сервис и базы данных."],
            github: "DO/07-docker-compose"
        },
        vagrant: {
            category: "DO / 07-DOCKER-COMPOSE",
            title: "Infrastructure Provisioning (Vagrant)",
            description: "Настроил автоматическое развертывание виртуальных машин с Docker и Docker Compose с помощью Vagrantfile.",
            evidence: ["Реализовано в проекте: DO / 07-docker-compose", "Настроил автоматическое развертывание виртуальных машин с Docker и Docker Compose с помощью Vagrantfile."],
            github: "DO/07-docker-compose"
        },
        postman: {
            category: "DO / 07-DOCKER-COMPOSE",
            title: "API Testing (Postman / Newman)",
            description: "Подготовил коллекцию интеграционных тестов в Postman (application_tests.postman_collection.json) для проверки эндпоинтов развернутого сервиса.",
            evidence: ["Реализовано в проекте: DO / 07-docker-compose", "Подготовил коллекцию интеграционных тестов в Postman (application_tests.postman_collection.json) для проверки эндпоинтов развернутого сервиса."],
            github: "DO/07-docker-compose"
        },
        portainer: {
            category: "DO / 07-DOCKER-COMPOSE",
            title: "Portainer & Container Management",
            description: "Развернул Portainer в Docker-стеке для визуального мониторинга и управления контейнерами, томами и сетями.",
            evidence: ["Реализовано в проекте: DO / 07-docker-compose", "Развернул Portainer в Docker-стеке для визуального мониторинга и управления контейнерами, томами и сетями."],
            github: "DO/07-docker-compose"
        },
        prometheus: {
            category: "DO / 08-MONITORING-ALERTING",
            title: "Prometheus Metrics Collection",
            description: "Развернул Prometheus для сбора системных и прикладных метрик, настроил конфигурацию prometheus.yml.",
            evidence: ["Реализовано в проекте: DO / 08-monitoring-alerting", "Развернул Prometheus для сбора системных и прикладных метрик, настроил конфигурацию prometheus.yml."],
            github: "DO/08-monitoring-alerting"
        },
        grafana: {
            category: "DO / 08-MONITORING-ALERTING",
            title: "Grafana Dashboards",
            description: "Создал дашборды в Grafana (grafana.json) для визуализации метрик производительности CPU, памяти, дисков и сетевого трафика.",
            evidence: ["Реализовано в проекте: DO / 08-monitoring-alerting", "Создал дашборды в Grafana (grafana.json) для визуализации метрик производительности CPU, памяти, дисков и сетевого трафика."],
            github: "DO/08-monitoring-alerting"
        },
        alertmanager: {
            category: "DO / 08-MONITORING-ALERTING",
            title: "Alertmanager & Alert Rules",
            description: "Сконфигурировал правила алертинга (alert.rules.yml) на критические пороги (нагрузка CPU/RAM, падение сервисов) и маршрутизацию в alertmanager.yml.",
            evidence: ["Реализовано в проекте: DO / 08-monitoring-alerting", "Сконфигурировал правила алертинга (alert.rules.yml) на критические пороги (нагрузка CPU/RAM, падение сервисов) и маршрутизацию в alertmanager.yml."],
            github: "DO/08-monitoring-alerting"
        },
        loki: {
            category: "DO / 08-MONITORING-ALERTING",
            title: "Grafana Loki (Log Aggregation)",
            description: "Подключил систему агрегации логов Loki (loki_config.yml) для централизованного сбора и анализа логов контейнеров.",
            evidence: ["Реализовано в проекте: DO / 08-monitoring-alerting", "Подключил систему агрегации логов Loki (loki_config.yml) для централизованного сбора и анализа логов контейнеров."],
            github: "DO/08-monitoring-alerting"
        },
        pg_basics: {
            category: "SQL / 01-SQL-BASICS",
            title: "PostgreSQL & Basic SQL Queries",
            description: "Написал базовые SQL-запросы (SELECT, WHERE, ORDER BY, LIMIT) для фильтрации, сортировки и выборки данных из реляционных таблиц.",
            evidence: ["Реализовано в проекте: SQL / 01-sql-basics", "Написал базовые SQL-запросы (SELECT, WHERE, ORDER BY, LIMIT) для фильтрации, сортировки и выборки данных из реляционных таблиц."],
            github: "SQL/01-sql-basics"
        },
        joins: {
            category: "SQL / 02-SQL-JOINS-SETS",
            title: "SQL JOINs & Set Operations",
            description: "Реализовал сложные соединения таблиц (INNER JOIN, LEFT/RIGHT JOIN, FULL OUTER JOIN) и операции над множествами (UNION, INTERSECT, EXCEPT).",
            evidence: ["Реализовано в проекте: SQL / 02-sql-joins-sets", "Реализовал сложные соединения таблиц (INNER JOIN, LEFT/RIGHT JOIN, FULL OUTER JOIN) и операции над множествами (UNION, INTERSECT, EXCEPT)."],
            github: "SQL/02-sql-joins-sets"
        },
        adv_joins: {
            category: "SQL / 03-SQL-ADVANCED-JOINS",
            title: "Advanced SQL JOINs & Subqueries",
            description: "Применил многоуровневые подзапросы и продвинутые джойны для решения аналитических задач сопоставления данных.",
            evidence: ["Реализовано в проекте: SQL / 03-sql-advanced-joins", "Применил многоуровневые подзапросы и продвинутые джойны для решения аналитических задач сопоставления данных."],
            github: "SQL/03-sql-advanced-joins"
        },
        dml: {
            category: "SQL / 04-SQL-DML-MODIFICATIONS",
            title: "SQL DML (INSERT, UPDATE, DELETE)",
            description: "Выполнил массовые операции модификации данных (INSERT INTO, UPDATE, DELETE, MERGE / условные вставки) с соблюдением целостности БД.",
            evidence: ["Реализовано в проекте: SQL / 04-sql-dml-modifications", "Выполнил массовые операции модификации данных (INSERT INTO, UPDATE, DELETE, MERGE / условные вставки) с соблюдением целостности БД."],
            github: "SQL/04-sql-dml-modifications"
        },
        views: {
            category: "SQL / 05-SQL-SNAPSHOTS-VIEWS",
            title: "SQL Views & Database Snapshots",
            description: "Создал виртуальные представления (CREATE VIEW) и реализовал механизмы логических снапшотов таблиц для аудита изменений.",
            evidence: ["Реализовано в проекте: SQL / 05-sql-snapshots-views", "Создал виртуальные представления (CREATE VIEW) и реализовал механизмы логических снапшотов таблиц для аудита изменений."],
            github: "SQL/05-sql-snapshots-views"
        },
        graph: {
            category: "SQL / 06-SQL-GRAPH-TSP",
            title: "SQL Graph & Recursive CTEs",
            description: "Решил классическую задачу коммивояжера (TSP) и построения графов на чистом SQL с использованием рекурсивных CTE (WITH RECURSIVE).",
            evidence: ["Реализовано в проекте: SQL / 06-sql-graph-tsp", "Решил классическую задачу коммивояжера (TSP) и построения графов на чистом SQL с использованием рекурсивных CTE (WITH RECURSIVE)."],
            github: "SQL/06-sql-graph-tsp"
        },
        indexes: {
            category: "SQL / 07-SQL-INDEXES",
            title: "Database Indexing (B-Tree, Hash)",
            description: "Создал и оптимизировал индексы (CREATE INDEX, B-Tree, составные индексы), проверил планы выполнения запросов через EXPLAIN ANALYZE.",
            evidence: ["Реализовано в проекте: SQL / 07-sql-indexes", "Создал и оптимизировал индексы (CREATE INDEX, B-Tree, составные индексы), проверил планы выполнения запросов через EXPLAIN ANALYZE."],
            github: "SQL/07-sql-indexes"
        },
        pg_features: {
            category: "SQL / 08-SQL-FEATURES-INTEGRATION",
            title: "PostgreSQL Advanced Features",
            description: "Использовал продвинутые типы данных PostgreSQL (JSONB, Arrays) и написал запросы интеграции внешних источников.",
            evidence: ["Реализовано в проекте: SQL / 08-sql-features-integration", "Использовал продвинутые типы данных PostgreSQL (JSONB, Arrays) и написал запросы интеграции внешних источников."],
            github: "SQL/08-sql-features-integration"
        },
        olap: {
            category: "SQL / 09-SQL-OLAP",
            title: "SQL OLAP & Window Functions",
            description: "Применил оконные функции (ROW_NUMBER(), RANK(), SUM() OVER, PARTITION BY, LAG/LEAD) и агрегации для OLAP-аналитики.",
            evidence: ["Реализовано в проекте: SQL / 09-sql-olap", "Применил оконные функции (ROW_NUMBER(), RANK(), SUM() OVER, PARTITION BY, LAG/LEAD) и агрегации для OLAP-аналитики."],
            github: "SQL/09-sql-olap"
        },
        isolation: {
            category: "SQL / 10-SQL-ISOLATION-LEVELS",
            title: "Transaction Isolation Levels",
            description: "Протестировал уровни изоляции транзакций (READ COMMITTED, REPEATABLE READ, SERIALIZABLE) и проявления аномалий (Dirty Read, Non-Repeatable Read, Phantom Read).",
            evidence: ["Реализовано в проекте: SQL / 10-sql-isolation-levels", "Протестировал уровни изоляции транзакций (READ COMMITTED, REPEATABLE READ, SERIALIZABLE) и проявления аномалий (Dirty Read, Non-Repeatable Read, Phantom Read)."],
            github: "SQL/10-sql-isolation-levels"
        },
        plpgsql: {
            category: "SQL / 11-SQL-FUNCTIONS-PROCS",
            title: "PostgreSQL PL/pgSQL Functions & Procedures",
            description: "Разработал хранимые процедуры и скалярные/табличные функции на языке PL/pgSQL с обработкой исключений, курсорами и транзакциями.",
            evidence: ["Реализовано в проекте: SQL / 11-sql-functions-procs", "Разработал хранимые процедуры и скалярные/табличные функции на языке PL/pgSQL с обработкой исключений, курсорами и транзакциями."],
            github: "SQL/11-sql-functions-procs"
        },
        python_alg: {
            category: "APP / 01-PYTHON-ALGORITHMS-BASICS",
            title: "Python Algorithms & Data Structures",
            description: "Реализовал базовые алгоритмы и структуры данных на Python (сортировки, поиски, структуры связных списков и деревьев).",
            evidence: ["Реализовано в проекте: APP / 01-python-algorithms-basics", "Реализовал базовые алгоритмы и структуры данных на Python (сортировки, поиски, структуры связных списков и деревьев)."],
            github: "APP/01-python-algorithms-basics"
        },
        python_multi: {
            category: "APP / 02-PYTHON-MULTIPROCESSING-SIMULATION",
            title: "Python Multiprocessing & Concurrency",
            description: "Написал многопроцессорные и многопоточные приложения на Python с использованием модулей multiprocessing и threading, синхронизацией через Queue и Lock.",
            evidence: ["Реализовано в проекте: APP / 02-python-multiprocessing-simulation", "Написал многопроцессорные и многопоточные приложения на Python с использованием модулей multiprocessing и threading, синхронизацией через Queue и Lock."],
            github: "APP/02-python-multiprocessing-simulation"
        },
        flask_api: {
            category: "APP / 03-FLASK-TIC-TAC-TOE-API",
            title: "Python Flask REST API",
            description: "Разработал RESTful API веб-сервис на микрофреймворке Flask для игры в крестики-нолики с архитектурным разделением слоев (datasource, domain, web, di).",
            evidence: ["Реализовано в проекте: APP / 03-flask-tic-tac-toe-api", "Разработал RESTful API веб-сервис на микрофреймворке Flask для игры в крестики-нолики с архитектурным разделением слоев (datasource, domain, web, di)."],
            github: "APP/03-flask-tic-tac-toe-api"
        },
        flask_pg: {
            category: "APP / 04-FLASK-MULTIPLAYER-POSTGRESQL",
            title: "Flask, PostgreSQL & Dependency Injection",
            description: "Спроектировал многопользовательское веб-приложение на Flask с подключением к PostgreSQL, паттерном внедрения зависимостей (di) и реляционной моделью данных.",
            evidence: ["Реализовано в проекте: APP / 04-flask-multiplayer-postgresql", "Спроектировал многопользовательское веб-приложение на Flask с подключением к PostgreSQL, паттерном внедрения зависимостей (di) и реляционной моделью данных."],
            github: "APP/04-flask-multiplayer-postgresql"
        }
    };

    const projects = {
        observability: {
            badge: "CASE_01 / OBSERVABILITY",
            title: "Централизованный мониторинг микросервисов",
            task: "Задача: спроектировать отказоустойчивую систему сбора метрик и логов для микросервисной архитектуры с автоматическим оповещением команды.",
            details: ["Развернул Prometheus, Grafana, Loki и Alertmanager в кластере Docker Swarm.", "Организовал внешние изолированные сети и персистентные тома для инфраструктурных сервисов.", "Настроил динамическое обнаружение Node Exporter, cAdvisor, Blackbox Exporter и прикладных endpoint через dns_sd_configs.", "Описал правила для CPU, высокого потребления RAM и критического дефицита памяти.", "Настроил мультиканальные уведомления через SMTP и Telegram Bot API."],
            code: ["groups:", "  - name: node_alerts", "    rules:", "      - alert: HighCPUUsage", "        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100) > 85", "        for: 2m", "        labels:", "          severity: critical", "        annotations:", "          summary: High CPU usage on {{ $labels.instance }}"].join("\n"),
            result: "Получился централизованный стек наблюдаемости с интерактивными дашбордами и оперативной доставкой критических инцидентов в Telegram. Срабатывание правил и устойчивость системы проверены нагрузочным тестированием утилитой stress."
        },
        cicd: {
            badge: "CASE_02 / CI-CD",
            title: "CI/CD для сборки и доставки C-проектов",
            task: "Задача: автоматизировать проверку кода, сборку бинарных файлов, тестирование и безопасный деплой с контролируемым запуском публикации.",
            details: ["Спроектировал многостадийный GitLab CI/CD pipeline: build, style, test и deploy.", "Настроил автоматическую компиляцию C-проектов через Make и сохранение артефактов.", "Добавил clang-format --Werror для блокировки кода, не соответствующего стандарту.", "Автоматизировал запуск модульных и интеграционных тестов.", "Реализовал ручной deploy через SCP и SSH, а также Telegram-уведомления через SOCKS5-прокси."],
            code: ["stages: [build, style, test, deploy]", "", "build:", "  stage: build", "  script:", "    - make clean && make", "  artifacts:", "    paths: [bin/]", "", "test:", "  stage: test", "  script:", "    - make test", "", "deploy:", "  stage: deploy", "  when: manual", "  script:", "    - scp bin/app user@server:/opt/app/"].join("\n"),
            result: "Внедрен полный конвейер доставки с автоматической сборкой, строгим контролем качества и ручным триггером публикации. Команда получает уведомления о статусах стадий, а ошибки стиля и тестов останавливают прохождение кода по pipeline."
        },
        network: {
            badge: "CASE_03 / LINUX NETWORK",
            title: "Маршрутизация и защита узлов Linux",
            task: "Задача: построить сеть виртуальных Linux-узлов со статической маршрутизацией, вспомогательными службами и проверяемыми правилами безопасности.",
            details: ["Рассчитал IP-адресацию, маски и границы хостов с помощью ipcalc.", "Настроил интерфейсы и персистентные статические маршруты через Netplan.", "Проверил пропускную способность каналов между узлами с помощью iperf3.", "Написал правила iptables с разными стратегиями фильтрации, включая блокировку ICMP.", "Настроил DHCP по MAC-адресам, NAT Masquerading и безопасный проброс портов через SSH-туннели."],
            code: ["network:", "  version: 2", "  ethernets:", "    enp0s8:", "      addresses: [192.168.10.1/24]", "      routes:", "        - to: 10.20.0.0/24", "          via: 192.168.10.254", "", "# NAT и фильтрация", "iptables -t nat -A POSTROUTING -o enp0s3 -j MASQUERADE", "iptables -A INPUT -p icmp -j DROP"].join("\n"),
            result: "Построена защищенная сеть между виртуальными узлами Linux с персистентной маршрутизацией, DHCP, NAT и SSH-доступом. Связность, пропускная способность и правила фильтрации проверены практическими тестами."
        }
    };

    function openDialog(dialog) {
        if (!dialog || dialog.open) return;
        dialog.showModal();
        syncPageLock();
    }

    function closeDialogOnBackdrop(dialog, event) {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) dialog.close();
    }

    function initDialogs() {
        qsa("dialog").forEach((dialog) => {
            qsa("[data-close-dialog]", dialog).forEach((button) => button.addEventListener("click", () => dialog.close()));
            dialog.addEventListener("click", (event) => closeDialogOnBackdrop(dialog, event));
            dialog.addEventListener("close", syncPageLock);
        });
    }

    function initSkills() {
        const dialog = qs("#skillDialog");
        if (!dialog) return;
        qsa(".skill-chip").forEach((button) => {
            button.addEventListener("click", () => {
                const skill = skills[button.dataset.skill];
                if (!skill) return;
                qs("#skillDialogCategory").textContent = skill.category;
                qs("#skillDialogTitle").textContent = skill.title;
                qs("#skillDialogDescription").textContent = skill.description;
                const link = qs("#skillDialogLink");
                if (link) {
                    const ghPath = skill.github || (skill.category.includes("/") ? skill.category.split(" / ")[1].toLowerCase() : "");
                    link.href = ghPath ? `https://github.com/flagminn/devops-portfolio/tree/main/${ghPath}` : "https://github.com/flagminn/devops-portfolio";
                }
                const evidence = qs("#skillDialogEvidence");
                evidence.replaceChildren(...skill.evidence.map((item) => {
                    const li = document.createElement("li");
                    li.textContent = item;
                    return li;
                }));
                openDialog(dialog);
            });
        });
    }

    function initProjects() {
        const track = qs("#projectsTrack");
        const dialog = qs("#projectDialog");
        const dialogTabs = qsa("[data-project-tab]");
        const dialogPanes = qsa("[data-project-pane]");

        function scrollProjects(direction) {
            if (!track) return;
            const card = qs(".project-card", track);
            const amount = (card?.getBoundingClientRect().width || track.clientWidth) + 20;
            track.scrollBy({ left: amount * direction, behavior: reducedMotion ? "auto" : "smooth" });
        }

        qs("#projectPrev")?.addEventListener("click", () => scrollProjects(-1));
        qs("#projectNext")?.addEventListener("click", () => scrollProjects(1));

        function activateProjectTab(index, focus = false) {
            dialogTabs.forEach((tab, tabIndex) => {
                const active = tabIndex === index;
                tab.classList.toggle("active", active);
                tab.setAttribute("aria-selected", String(active));
                tab.tabIndex = active ? 0 : -1;
                if (active && focus) tab.focus();
            });
            dialogPanes.forEach((pane) => { pane.hidden = pane.dataset.projectPane !== dialogTabs[index].dataset.projectTab; });
        }

        dialogTabs.forEach((tab, index) => tab.addEventListener("click", () => activateProjectTab(index)));
        setupRovingTabs(dialogTabs, activateProjectTab);

        qsa(".open-project").forEach((button) => {
            button.addEventListener("click", () => {
                const project = projects[button.dataset.project];
                if (!project || !dialog) return;
                qs("#projectDialogBadge").textContent = project.badge;
                qs("#projectDialogTitle").textContent = project.title;
                qs("#projectDialogTask").textContent = project.task;
                qs("#projectDialogCode").textContent = project.code;
                qs("#projectDialogResult").textContent = project.result;
                const details = qs("#projectDialogDetails");
                details.replaceChildren(...project.details.map((item) => {
                    const li = document.createElement("li");
                    li.textContent = item;
                    return li;
                }));
                activateProjectTab(0);
                openDialog(dialog);
            });
        });
    }

    const quizQuestions = [
        {
            question: "Какой профиль задач сейчас в приоритете?",
            options: [
                { text: "Полноценное системное администрирование (Linux/Windows): серверы, сети, резервное копирование, безопасность и стабильность инфраструктуры.", score: 35, insight: "Профиль задач полностью совпадает с моим опытом и навыками." },
                { text: "Инфраструктурные задачи с уклоном в DevOps: контейнеры (Docker), мониторинг (Prometheus/Grafana), CI/CD-пайплайны и работа с БД.", score: 35, insight: "Инфраструктура с уклоном в DevOps и контейнеризацию — именно то, с чем я работаю." },
                { text: "Администрирование серверов и сетей (80% времени) + редкие сложные эскалации (20% времени).", score: 25, insight: "Отличный баланс ежедневных задач по администрированию и поддержке." },
                { text: "Первая линия хелпдеска: прием звонков, замена картриджей и бесконечная настройка принтеров.", score: 0, insight: "Я перерос задачи первой линии и ищу роль системного администратора." },
                { text: "Senior DevOps / Архитектор под высоконагруженные Kubernetes-кластеры в продакшне.", score: 5, insight: "У меня Junior+ уровень в DevOps и сильная база по Linux и сетям, а не многолетний production Kubernetes." },
                { text: "Пропустить вопрос (не учитывается в расчете итогового процента)", score: 0, neutral: true, insight: "Вопрос пропущен." }
            ]
        },
        {
            question: "В каком состоянии находится инфраструктура и процессы?",
            options: [
                { text: "Нужно навести порядок с нуля: провести аудит, настроить бэкапы, документацию и учет активов (CMDB).", score: 25, insight: "Люблю наводить порядок, структурировать активы и писать документацию с нуля." },
                { text: "Инфраструктура работает, но много ручных операций — нужно писать скрипты (Bash/Python) и внедрять мониторинг.", score: 25, insight: "Готов автоматизировать рутину с помощью Bash/Python и настраивать мониторинг." },
                { text: "Крупный энтерпрайз с жесткими регламентами и узкой зоной ответственности на одном сервисе.", score: 15, insight: "Готов работать по регламентам и углубляться в специфику сервисов." },
                { text: "Пропустить вопрос (не учитывается в расчете итогового процента)", score: 0, neutral: true, insight: "Вопрос пропущен." }
            ]
        },
        {
            question: "Какой основной стек технологий используется в вашей инфраструктуре?",
            options: [
                { text: "Смешанная среда (Linux-серверы + Windows Server / Active Directory) и локальные сети (LAN/VPN).", score: 20, insight: "Смешанная среда Linux + Windows Server и локальные сети — моя основная зона практики." },
                { text: "Преимущественно Linux (Ubuntu/Debian), контейнеризация (Docker), PostgreSQL и веб-сервисы.", score: 20, insight: "Стек Linux, Docker, PostgreSQL и веб-сервисы полностью соответствует моим проектам." },
                { text: "Инфраструктура с упором на сети, безопасность (межсетевые экраны, маршрутизация) и системы мониторинга.", score: 20, insight: "Сетевые технологии, безопасность и мониторинг — сильная сторона моих навыков." },
                { text: "Узкоспециализированные проприетарные системы, редкие ОС или чистое «железо» ЦОД без Linux/Windows.", score: 5, insight: "Специализированные редкие ОС потребуют дополнительного времени на погружение." },
                { text: "Пропустить вопрос (не учитывается в расчете итогового процента)", score: 0, neutral: true, insight: "Вопрос пропущен." }
            ]
        },
        {
            question: "Какой подход к работе и инструментам ценится в вашей команде?",
            options: [
                { text: "Самостоятельность (умение изучить документацию и протестировать решение на стенде) + разумное использование AI для ускорения скриптов.", score: 20, insight: "Привык работать самостоятельно, проверять решения на стенде и использовать AI как инструмент черновика." },
                { text: "Готовность работать по строгому ревью кода/конфигов и развиваться в сильной инженерной команде.", score: 20, insight: "Ценю код-ревью и командные стандарты разработки и инфраструктуры." },
                { text: "Нужен руководитель большого ИТ-департамента на 30+ человек без работы руками.", score: 5, insight: "Я инженер, который решает задачи руками и головой, а не управленец крупного департамента." },
                { text: "Пропустить вопрос (не учитывается в расчете итогового процента)", score: 0, neutral: true, insight: "Вопрос пропущен." }
            ]
        }
    ];

    function initQuiz() {
        const intro = qs("#quizIntro");
        const game = qs("#quizGame");
        const result = qs("#quizResult");
        const questionElement = qs("#quizQuestion");
        const optionsElement = qs("#quizOptions");
        const progress = qs("#quizProgress");
        if (!intro || !game || !result || !questionElement || !optionsElement) return;
        let currentQuestion = 0;
        let answers = [];

        function renderQuestion() {
            const item = quizQuestions[currentQuestion];
            qs("#quizStepLabel").textContent = `ВОПРОС ${String(currentQuestion + 1).padStart(2, "0")} / ${String(quizQuestions.length).padStart(2, "0")}`;
            qs("#quizProgressBar").style.width = `${((currentQuestion + 1) / quizQuestions.length) * 100}%`;
            progress?.setAttribute("aria-valuenow", String(currentQuestion + 1));
            questionElement.textContent = item.question;
            const buttons = item.options.map((option, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "quiz-option";
                const marker = document.createElement("span");
                marker.className = "option-index";
                marker.textContent = String.fromCharCode(65 + index);
                const text = document.createElement("span");
                text.textContent = option.text;
                button.append(marker, text);
                button.addEventListener("click", () => selectAnswer(index));
                return button;
            });
            optionsElement.replaceChildren(...buttons);
        }

        function selectAnswer(index) {
            answers[currentQuestion] = index;
            if (currentQuestion < quizQuestions.length - 1) {
                currentQuestion += 1;
                renderQuestion();
                qs(".quiz-option", optionsElement)?.focus();
            } else {
                showResult();
            }
        }

        function showResult() {
            const selected = answers.map((answer, index) => answer !== undefined ? quizQuestions[index].options[answer] : null).filter(Boolean);
            const activeQuestions = selected.filter((option) => !option.neutral);
            const score = activeQuestions.reduce((total, option) => total + option.score, 0);
            const maxScore = activeQuestions.length > 0 ? activeQuestions.length * 35 : 1;
            const percent = activeQuestions.length === 0 ? 0 : Math.round((score / maxScore) * 100);
            game.hidden = true;
            result.hidden = false;
            if (activeQuestions.length === 0) {
                qs("#quizScore").textContent = "—";
                qs("#quizResultTitle").textContent = "Вы пропустили все вопросы";
                qs("#quizResultText").textContent = "Вы пропустили все вопросы — но я всё равно готов пообщаться и рассказать о своем опыте лично.";
            } else {
                qs("#quizScore").textContent = `${percent}%`;
                const title = percent >= 80 ? "Отличное совпадение" : percent >= 55 ? "Хороший потенциал" : "Честный фильтр";
                const text = percent >= 80 
                    ? "Мы точно на одной волне. Мои навыки в администрировании Linux/Windows, настройке сетей, бэкапов и автоматизации на Bash/Python закрывают ваши задачи с первого дня. Давайте созвонимся и обсудим инфраструктуру?"
                    : percent >= 55 
                    ? "Я закрою большинство ваших задач по серверам, сетям и мониторингу, а в узких местах быстро разберусь по официальной документации. Готов обсудить детали на техническом интервью."
                    : "Похоже, сейчас у вас запрос либо на первую линию хелпдеска, либо на Senior-архитектора. Я сфокусирован именно на системном администрировании и развитии в DevOps, поэтому сэкономлю ваше время, но буду рад остаться на связи.";
                qs("#quizResultTitle").textContent = title;
                qs("#quizResultText").textContent = text;
            }
            const strongest = selected.filter((option) => !option.neutral).map((option) => option.insight);
            const insights = strongest.length ? strongest : ["На интервью предлагаю разобрать реальную инфраструктурную задачу и сверить ожидания."];
            qs("#quizArguments").replaceChildren(...insights.map((insight) => {
                const li = document.createElement("li");
                li.textContent = insight;
                return li;
            }));
            const message = `Азат, здравствуйте! Прошел TEAM FIT CHECK на вашем сайте (совпадение: ${activeQuestions.length === 0 ? 'пропущено' : percent + '%'}). Хотел бы обсудить вакансию и наши процессы.`;
            qs("#quizContact").href = `https://t.me/flagminn?text=${encodeURIComponent(message)}`;
            qs("#quizRestart")?.focus();
        }

        function startQuiz() {
            currentQuestion = 0;
            answers = [];
            intro.hidden = true;
            result.hidden = true;
            game.hidden = false;
            renderQuestion();
            qs(".quiz-option", optionsElement)?.focus();
        }

        qs("#quizStart")?.addEventListener("click", startQuiz);
        qs("#quizRestart")?.addEventListener("click", startQuiz);
    }

    function initAchievementLog() {
        const log = qs("#achievementLog");
        const toggle = qs("#logToggle");
        const next = qs("#logNext");
        if (!log || !toggle || !next) return;
        const lines = qsa("li", log);
        let activeIndex = 0;
        let pausedByUser = reducedMotion;
        let hovered = false;

        function updateToggle() {
            toggle.textContent = pausedByUser ? "Запустить ленту" : "Пауза";
            toggle.setAttribute("aria-pressed", String(pausedByUser));
        }

        function showLine(index) {
            activeIndex = (index + lines.length) % lines.length;
            lines.forEach((line, lineIndex) => line.classList.toggle("active", lineIndex === activeIndex));
            const targetTop = Math.max(0, lines[activeIndex].offsetTop - log.clientHeight / 2 + lines[activeIndex].clientHeight / 2);
            log.scrollTop = targetTop;
        }

        toggle.addEventListener("click", () => {
            pausedByUser = !pausedByUser;
            updateToggle();
        });
        next.addEventListener("click", () => showLine(activeIndex + 1));
        log.addEventListener("mouseenter", () => { hovered = true; });
        log.addEventListener("mouseleave", () => { hovered = false; });
        log.addEventListener("focusin", () => { hovered = true; });
        log.addEventListener("focusout", () => { hovered = false; });
        window.setInterval(() => {
            if (!pausedByUser && !hovered && !document.hidden) showLine(activeIndex + 1);
        }, 2800);
        updateToggle();
    }

    function initCanvas() {
        const canvas = qs("#networkCanvas");
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        let width = 0;
        let height = 0;
        let particles = [];
        const pointer = { x: null, y: null, radius: 150 };

        function createParticles() {
            const count = Math.min(Math.floor(width / 24), width < 700 ? 28 : 62);
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: Math.random() * 1.4 + 0.6
            }));
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            createParticles();
            if (reducedMotion) draw(false);
        }

        function draw(move = true) {
            context.clearRect(0, 0, width, height);
            particles.forEach((particle, index) => {
                if (move) {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > height) particle.vy *= -1;
                }

                if (pointer.x !== null) {
                    const dx = particle.x - pointer.x;
                    const dy = particle.y - pointer.y;
                    const distance = Math.hypot(dx, dy) || 1;
                    if (distance < pointer.radius && move) {
                        const force = (pointer.radius - distance) / pointer.radius;
                        particle.x += (dx / distance) * force * 1.4;
                        particle.y += (dy / distance) * force * 1.4;
                    }
                }

                context.beginPath();
                context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                context.fillStyle = "rgba(103, 232, 249, 0.42)";
                context.fill();

                for (let secondIndex = index + 1; secondIndex < particles.length; secondIndex += 1) {
                    const second = particles[secondIndex];
                    const distance = Math.hypot(particle.x - second.x, particle.y - second.y);
                    if (distance < 115) {
                        context.beginPath();
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(second.x, second.y);
                        context.strokeStyle = `rgba(103, 232, 249, ${0.1 * (1 - distance / 115)})`;
                        context.lineWidth = 0.7;
                        context.stroke();
                    }
                }
            });
        }

        function animate() {
            if (!document.hidden) draw();
            window.requestAnimationFrame(animate);
        }

        window.addEventListener("resize", resize, { passive: true });
        window.addEventListener("pointermove", (event) => {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
        }, { passive: true });
        document.documentElement.addEventListener("mouseleave", () => {
            pointer.x = null;
            pointer.y = null;
        });
        resize();
        if (!reducedMotion) animate();
    }

    function initCardEffects() {
        if (!finePointer || reducedMotion) return;
        qsa("[data-tilt]").forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;
                card.style.setProperty("--rotate-x", `${(0.5 - y) * 3.5}deg`);
                card.style.setProperty("--rotate-y", `${(x - 0.5) * 3.5}deg`);
                card.style.setProperty("--spot-x", `${x * 100}%`);
                card.style.setProperty("--spot-y", `${y * 100}%`);
            });
            card.addEventListener("pointerleave", () => {
                card.style.setProperty("--rotate-x", "0deg");
                card.style.setProperty("--rotate-y", "0deg");
            });
        });

        if (hasGsap) {
            qsa(".btn-magnetic").forEach((button) => {
                button.addEventListener("pointermove", (event) => {
                    const rect = button.getBoundingClientRect();
                    window.gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * 0.16, y: (event.clientY - rect.top - rect.height / 2) * 0.16, duration: 0.25, ease: "power2.out" });
                });
                button.addEventListener("pointerleave", () => window.gsap.to(button, { x: 0, y: 0, duration: 0.45, ease: "elastic.out(1, 0.45)" }));
            });
        }
    }

    function initGsapAnimations() {
        if (!hasGsap || reducedMotion) return;
        const gsap = window.gsap;
        const matchMedia = gsap.matchMedia();

        gsap.from(".hero-badge, .hero-role, .hero-title, .hero-subtitle, .hero-tags, .hero-actions, .inline-terminal", {
            y: 24,
            opacity: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "opacity,transform"
        });
        gsap.from(".hero-visual", { x: 25, opacity: 0, duration: 1, delay: 0.18, ease: "power3.out", clearProps: "opacity,transform" });

        if (hasScrollTrigger) {
            qsa(".section-header, .synergy-intro, .faq-intro, .achievements-copy").forEach((element) => {
                gsap.from(element, {
                    y: 28,
                    opacity: 0,
                    duration: 0.75,
                    ease: "power2.out",
                    clearProps: "opacity,transform",
                    scrollTrigger: { trigger: element, start: "top 88%", once: true }
                });
            });

            matchMedia.add("(min-width: 901px)", () => {
                qsa(".morph-target").forEach((element) => {
                    gsap.fromTo(element,
                        { clipPath: "inset(9% round 36px)", scale: 0.975 },
                        { clipPath: "inset(0% round 0px)", scale: 1, ease: "none", scrollTrigger: { trigger: element, start: "top 92%", end: "top 48%", scrub: 1 } }
                    );
                });
                gsap.to(".avatar-img", { yPercent: -5, ease: "none", scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 1 } });
            });

            qsa("[data-count]").forEach((element) => {
                const target = Number(element.dataset.count);
                const state = { value: 0 };
                gsap.to(state, {
                    value: target,
                    duration: 1.4,
                    ease: "power2.out",
                    onUpdate: () => { element.textContent = String(Math.round(state.value)); },
                    scrollTrigger: { trigger: element, start: "top 90%", once: true }
                });
            });
        }

        if (window.TextPlugin) {
            const textElement = qs("#typewriterText");
            const phrases = [
                "deploying_resilient_infrastructure...",
                "analyzing_logs_before_rebooting...",
                "docker_swarm_cluster_online...",
                "prometheus_alerts_configured...",
                "automating_routine_with_bash...",
                "documenting_the_final_result..."
            ];
            if (textElement) {
                textElement.textContent = "";
                const timeline = gsap.timeline({ repeat: -1, delay: 0.8 });
                phrases.forEach((phrase) => {
                    timeline.to(textElement, { text: { value: phrase, delimiter: "" }, duration: 1.25, ease: "none" })
                        .to({}, { duration: 1.25 })
                        .to(textElement, { text: "", duration: 0.45, ease: "none" })
                        .to({}, { duration: 0.18 });
                });
            }
        }
    }

    function populateDeviceGrid() {
        const grid = qs(".device-grid");
        if (!grid) return;
        const cells = Array.from({ length: 50 }, () => document.createElement("i"));
        grid.replaceChildren(...cells);
    }

    function init() {
        initMotionEngine();
        populateDeviceGrid();
        initNavigation();
        initRecruiterTools();
        initExperience();
        initDialogs();
        initSkills();
        initProjects();
        initQuiz();
        initAchievementLog();
        initCanvas();
        initCardEffects();
        initGsapAnimations();
        const year = qs("#currentYear");
        if (year) year.textContent = String(new Date().getFullYear());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
