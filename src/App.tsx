import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  contraindications,
  education,
  faqs,
  medicalDisclaimer,
  navigation,
  photoUrl,
  portrait,
  practice,
  principles,
  requests,
  review,
  services,
  spacePhotos,
  steps,
  type PracticePhoto,
} from './content';

type IconName = 'arrow' | 'arrow-up' | 'down' | 'phone' | 'pin' | 'copy' | 'check' | 'plus' | 'close' | 'menu' | 'telegram' | 'info' | 'expand' | 'left';

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    'arrow-up': <><path d="M6 18 18 6M6 6h12v12" /></>,
    down: <><path d="M12 4v16m-6-6 6 6 6-6" /></>,
    left: <><path d="M20 12H4m7-7-7 7 7 7" /></>,
    phone: <path d="m8 3 3 5-3 2a14 14 0 0 0 6 6l2-3 5 3-1 4c-.2.7-1 1-2 1C10 20 4 14 3 6c0-1 .3-1.8 1-2l4-1Z" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M5 12h14M12 5v14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    menu: <path d="M4 7h16M4 16h16" />,
    telegram: <><path d="m21 3-4 18-6-6-4 3 1-7L21 3ZM3 10l18-7M3 10l5 1m3 4 5-7" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.1" /></>,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  };
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Monogram({ className = '' }: { className?: string }) {
  return (
    <img className={`monogram ${className}`} src="/logo.jpg" alt="" aria-hidden="true" style={{ width: 44, height: 49, objectFit: 'contain' }} />
  );
}

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <a className="wordmark" href="#home" aria-label="Владимир Курто, в начало страницы" onClick={onClick}>
      <Monogram />
      <span className="wordmark-text"><span>{practice.name}</span><small>КИНЕЗИОЛОГ · МАСТЕР ЛАДАНИЯ</small></span>
    </a>
  );
}

function ExternalLink({ href, children, className = '', ariaLabel }: { href: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>{children}</a>;
}

function BookingLink({ className = '', children = 'Записаться на сеанс' }: { className?: string; children?: ReactNode }) {
  return <ExternalLink href={practice.booking} className={`button button-primary ${className}`} ariaLabel="Записаться на сеанс к Владимиру Курто через BookNow, откроется в новой вкладке"><span>{children}</span><Icon name="arrow" /></ExternalLink>;
}

function Photo({ photo, className = '', eager = false, sizes = '(max-width: 760px) 100vw, 50vw', full = false }: { photo: PracticePhoto; className?: string; eager?: boolean; sizes?: string; full?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`photo ${className}`}>
      {failed ? <div className="photo-unavailable"><Monogram /><p>Фотография временно недоступна</p></div> : (
        <img
          src={full ? photo.original : photoUrl(photo, 1200)}
          srcSet={full ? undefined : `${photoUrl(photo, 480)} 480w, ${photoUrl(photo, 800)} 800w, ${photoUrl(photo, 1200)} 1200w`}
          sizes={sizes}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onError={(event) => {
            const image = event.currentTarget;
            if (image.dataset.fallback !== 'true' && !full) {
              image.dataset.fallback = 'true';
              image.removeAttribute('srcset');
              image.src = photo.original;
            } else setFailed(true);
          }}
        />
      )}
    </div>
  );
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* Older browsers can still copy from a temporary selection. */ }
  const previousFocus = document.activeElement as HTMLElement | null;
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  const host = document.querySelector('dialog[open]') || document.body;
  host.appendChild(input);
  input.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { copied = false; }
  input.remove();
  previousFocus?.focus({ preventScroll: true });
  return copied;
}

function CopyButton({ text = practice.address, label = 'Скопировать адрес', className = '' }: { text?: string; label?: string; className?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <span className={`copy-control ${className}`}>
      <button className="text-action" type="button" onClick={async () => {
        clearTimeout(timer.current);
        setStatus(await copyText(text) ? 'copied' : 'error');
        timer.current = setTimeout(() => setStatus('idle'), 4000);
      }}><Icon name={status === 'copied' ? 'check' : 'copy'} /><span aria-live="polite">{status === 'copied' ? 'Скопировано' : label}</span></button>
      {status === 'error' && <span className="copy-error" role="status">Выделите и скопируйте текст вручную.</span>}
    </span>
  );
}

function Disclosure({ title, children, className = '', defaultOpen = false }: { title: string; children: ReactNode; className?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`disclosure ${open ? 'is-open' : ''} ${className}`}>
      <h3><button type="button" className="disclosure-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><span>{title}</span><Icon name="plus" /></button></h3>
      <div id={id} className="disclosure-panel" aria-hidden={!open} inert={!open}><div><div className="disclosure-content">{children}</div></div></div>
    </div>
  );
}

function MedicalNote({ className = '' }: { className?: string }) {
  return <aside className={`medical-note ${className}`} aria-label="Важная информация о здоровье"><Icon name="info" /><p>{medicalDisclaimer}</p></aside>;
}

function Modal({ children, onClose, variant = '', titleId, onKeyDown }: { children: ReactNode; onClose: () => void; variant?: string; titleId: string; onKeyDown?: (event: KeyboardEvent<HTMLDialogElement>) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog ref={ref} className={`modal ${variant}`} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={onKeyDown}>
      <div className="modal-inner">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть окно" type="button"><Icon name="close" /></button>
        {children}
      </div>
    </dialog>
  );
}

function ContactForm({ onLegal }: { onLegal: () => void }) {
  const [fields, setFields] = useState({ name: '', phone: '', comment: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const readyRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (draft) readyRef.current?.focus({ preventScroll: true }); }, [draft]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (fields.name.trim().length < 2) nextErrors.name = 'Пожалуйста, укажите имя (не менее двух букв).';
    const digits = fields.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) nextErrors.phone = 'Укажите телефон с кодом страны: от 10 до 15 цифр.';
    if (!fields.consent) nextErrors.consent = 'Подтвердите, что ознакомились с условиями передачи сообщения.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = formRef.current?.elements.namedItem(Object.keys(nextErrors)[0]);
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    // Backend integration point. A prepared draft is never reported as a sent request.
    setDraft(`Здравствуйте, Владимир! Хочу обсудить запись на сеанс.\n\nИмя: ${fields.name.trim()}\nТелефон: ${fields.phone.trim()}${fields.comment.trim() ? `\nМой запрос: ${fields.comment.trim()}` : ''}`);
  }

  if (draft) return (
    <div className="contact-form form-ready">
      <span className="form-step">ОСТАЛСЯ ОДИН ШАГ</span>
      <h3 ref={readyRef} tabIndex={-1}>Сообщение подготовлено</h3>
      <p>Оно ещё не отправлено. Откройте Telegram и отправьте сообщение Владимиру в личном чате.</p>
      <div className="message-preview">{draft}</div>
      <ExternalLink href={`${practice.telegram}?text=${encodeURIComponent(draft)}`} className="button button-primary"><span>Открыть Telegram</span><Icon name="telegram" /></ExternalLink>
      <CopyButton text={draft} label="Скопировать сообщение" />
      <button type="button" className="text-action edit-request" onClick={() => { setDraft(null); setTimeout(() => formRef.current?.querySelector('input')?.focus(), 0); }}><Icon name="left" />Изменить заявку</button>
      <p className="form-hint">Если Telegram не подставил текст, скопируйте его и вставьте в чат самостоятельно.</p>
    </div>
  );

  return (
    <form ref={formRef} className="contact-form" onSubmit={handleSubmit} noValidate>
      <span className="form-step">ПЕРВЫЙ ШАГ</span>
      <h3>Расскажите о своём запросе</h3>
      <p className="form-intro">Подготовим сообщение для личного чата с Владимиром.</p>
      <div className="form-field">
        <label htmlFor="request-name">Ваше имя <span aria-hidden="true">*</span></label>
        <input id="request-name" name="name" type="text" autoComplete="given-name" placeholder="Как к вам обращаться?" maxLength={80} required value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
        {errors.name && <span id="name-error" className="field-error" role="alert">{errors.name}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="request-phone">Телефон <span aria-hidden="true">*</span></label>
        <input id="request-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" maxLength={24} required value={fields.phone} onChange={(event) => setFields({ ...fields, phone: event.target.value.replace(/[^\d+()\s-]/g, '') })} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
        {errors.phone && <span id="phone-error" className="field-error" role="alert">{errors.phone}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="request-comment">Комментарий / ваш запрос <span className="optional">необязательно</span></label>
        <textarea id="request-comment" name="comment" rows={2} placeholder="О чём вы хотели бы поговорить?" maxLength={600} value={fields.comment} onChange={(event) => setFields({ ...fields, comment: event.target.value })} aria-describedby="comment-hint" />
        <small id="comment-hint">Не указывайте диагнозы и другие медицинские данные.</small>
      </div>
      <label className="consent-label">
        <input type="checkbox" name="consent" checked={fields.consent} onChange={(event) => setFields({ ...fields, consent: event.target.checked })} required aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'consent-error' : undefined} />
        <span>Я понимаю, что отправку сообщения нужно подтвердить самостоятельно в Telegram.</span>
      </label>
      {errors.consent && <span id="consent-error" className="field-error" role="alert">{errors.consent}</span>}
      <button type="submit" className="button button-primary form-submit"><span>Отправить заявку</span><Icon name="arrow" /></button>
      <p className="form-hint">Сайт только подготовит черновик. Данные не отправляются автоматически и не сохраняются приложением. <button type="button" className="inline-link" onClick={onLegal}>Об обработке данных</button></p>
    </form>
  );
}

function LegalContent({ kind }: { kind: 'privacy' | 'consent' }) {
  return (
    <div className="legal-content">
      <p className="eyebrow">ИНФОРМАЦИЯ ДЛЯ ПОСЕТИТЕЛЕЙ</p>
      <h2 id="legal-title">{kind === 'privacy' ? 'Конфиденциальность' : 'Обработка персональных данных'}</h2>
      <p className="legal-draft">Редактируемый проект документа. Перед публикацией владелец сайта должен заполнить реквизиты и согласовать окончательный текст.</p>
      <h3>Как работает эта версия сайта</h3>
      <p>Форма обрабатывает введённые имя, телефон и комментарий только в памяти открытой страницы. В приложении нет сервера приёма заявок, базы данных, аналитики или сохранения полей в localStorage. После перезагрузки страницы введённые значения удаляются из памяти приложения.</p>
      <h3>Передача сообщения</h3>
      <p>Кнопка «Отправить заявку» подготавливает черновик и не отправляет его специалисту. Только после нажатия «Открыть Telegram» текст передаётся Telegram в ссылке. Чтобы Владимир получил сообщение, посетитель должен самостоятельно отправить его в чате. Не включайте в комментарий медицинские сведения.</p>
      <h3>Внешние сервисы</h3>
      <p>Онлайн-запись открывается в BookNow. Карты, Telegram и MAX открываются на внешних сайтах. Фотографии загружаются с сервера изображений BookNow; при загрузке сервер получает технические сведения, необходимые для передачи изображения. Правила внешних сервисов действуют на их стороне. Хостинг сайта также может вести технические журналы в соответствии со своими правилами.</p>
      <h3>Оператор и обращения</h3>
      <p>{practice.name}<br />{practice.legal.operatorDetails}<br />{practice.legal.contactEmail}</p>
      <p>Связь со специалистом: <a className="inline-link" href={practice.phoneHref}>{practice.phone}</a>.</p>
      {kind === 'consent' && <><h3>Перед подключением автоматических заявок</h3><p>Необходимо определить оператора, цели и правовое основание обработки, состав данных, получателей, сроки хранения и порядок отзыва согласия. Этот проект не является готовым согласием на ещё не подключённую серверную обработку.</p></>}
    </div>
  );
}

function Seo() {
  const canonical = new URL(practice.slug, window.location.origin).href;
  useEffect(() => {
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical);
    let ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonical;
  }, [canonical]);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${canonical}#practice`,
        name: 'Частная практика Владимира Курто',
        description: 'Кинезиология, P-DTR, Ладание и сенсорная адаптация. Индивидуальная работа с телом и состоянием.',
        url: canonical,
        image: portrait.original,
        telephone: '+79137500748',
        address: { '@type': 'PostalAddress', streetAddress: 'ул. Покатная, 130/1, Aurelspa', addressLocality: 'Новосибирск', addressCountry: 'RU' },
        hasMap: practice.yandex,
        sameAs: [practice.telegram, practice.reviews],
        founder: { '@type': 'Person', name: practice.name, jobTitle: practice.role },
      },
      { '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />;
}

export default function App() {
  const [modal, setModal] = useState<'menu' | 'privacy' | 'consent' | 'gallery' | null>(null);
  const [activeService, setActiveService] = useState<string | null>(services[0].id);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [pastHero, setPastHero] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    if (!reducedMotion) revealElements.forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('will-reveal');
      revealObserver.observe(element);
    });
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-15% 0px -65% 0px' });
    navigation.forEach((item) => { const section = document.querySelector(item.href); if (section) sectionObserver.observe(section); });
    const heroObserver = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0 });
    if (heroRef.current) heroObserver.observe(heroRef.current);
    const onScroll = () => setHeaderScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
      heroObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const nextPhoto = (direction: number) => setGalleryIndex((current) => (current + direction + spacePhotos.length) % spacePhotos.length);
  const openLegal = (kind: 'privacy' | 'consent') => {
    const url = kind === 'privacy' ? practice.legal.privacyUrl : practice.legal.consentUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else setModal(kind);
  };

  return (
    <>
      <Seo />
      <a href="#main" className="skip-link">Перейти к содержимому</a>
      <div id="home" className="page-top" />
      <header className={`site-header ${headerScrolled ? 'is-scrolled' : ''}`}>
        <div className="shell header-inner">
          <Wordmark />
          <nav className="desktop-nav" aria-label="Основная навигация">
            {navigation.map((item) => <a href={item.href} key={item.href} className={activeSection === item.href.slice(1) ? 'is-active' : ''} aria-current={activeSection === item.href.slice(1) ? 'location' : undefined}>{item.label}</a>)}
          </nav>
          <a className="header-phone" href={practice.phoneHref}>{practice.phone}</a>
          <BookingLink className="header-booking">Записаться</BookingLink>
          <button type="button" className="icon-button menu-toggle" aria-label="Открыть меню" aria-haspopup="dialog" aria-expanded={modal === 'menu'} onClick={() => setModal('menu')}><Icon name="menu" /></button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section ref={heroRef} className="hero" aria-labelledby="hero-heading">
          <div className="hero-scene"><Photo photo={portrait} className="hero-photo" eager sizes="(max-width: 700px) 100vw, 68vw" /><div className="hero-wash" /></div>
          <div className="shell hero-inner">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow"><span className="eyebrow-line" />ЧАСТНАЯ ПРАКТИКА В НОВОСИБИРСКЕ</p>
              <h1 id="hero-heading"><span className="hero-name">Владимир Курто</span><span className="hero-role">Кинезиолог, мастер Ладания</span><span className="hero-statement">Вернуться в контакт<br />с собой <em>и своим телом</em></span></h1>
              <p className="hero-description">Индивидуальная работа с телом и состоянием<br className="desktop-break" /> в спокойной, комфортной атмосфере.</p>
              <div className="hero-actions"><BookingLink /><a className="hero-call" href={practice.phoneHref}><Icon name="phone" /><span><small>Позвонить</small>{practice.phone}</span></a></div>
              <a href="#space" className="hero-location"><Icon name="pin" /><span>{practice.shortAddress}</span></a>
            </div>
            <a href="#about" className="hero-scroll" aria-label="Узнать больше о специалисте"><span>БЛИЖЕ К СЕБЕ</span><span className="scroll-line" /><Icon name="down" /></a>
          </div>
        </section>

        <section id="about" className="section about-section" aria-labelledby="about-heading">
          <div className="shell about-grid">
            <div className="about-visual" data-reveal><Photo photo={portrait} className="about-photo" sizes="(max-width: 760px) 100vw, 38vw" /><div className="photo-caption"><span>ЛИЧНОЕ ВНИМАНИЕ. БЕРЕЖНАЯ РАБОТА.</span><span>01 / ЗНАКОМСТВО</span></div></div>
            <div className="about-copy" data-reveal>
              <p className="eyebrow">О СПЕЦИАЛИСТЕ</p><h2 id="about-heading">Владимир Курто</h2><p className="about-role">Кинезиолог, мастер Ладания в Новосибирске</p>
              <p className="body-large">В работе я уделяю внимание индивидуальным особенностям человека, его телесному состоянию и ощущениям.</p>
              <p>Моя задача: создать пространство, в котором можно спокойно обратить внимание на себя и своё состояние.</p>
              <p>Здесь не нужно торопиться или подбирать «правильные» слова. Начать можно с того, что вы чувствуете сейчас.</p>
              <p className="personal-signoff">С вниманием к вам, <span>Владимир</span></p>
              <Disclosure title="Образование, обучение и подход" className="education-disclosure">
                <ul className="education-list">{education.map((item) => <li key={item.title}><span className="education-year">{item.year}</span><div><h4>{item.title}</h4><p>{item.place}</p>{item.note && <small>{item.note}</small>}</div></li>)}</ul>
                <dl className="editable-information"><div><dt>Направления</dt><dd>Кинезиология, P-DTR, Ладание, сенсорная адаптация.</dd></div><div><dt>Опыт</dt><dd>{practice.experience || 'Сведения будут дополнены после уточнения.'}</dd></div><div><dt>Сертификаты</dt><dd>{practice.certificates.length ? practice.certificates.map((certificate) => <ExternalLink href={certificate.url} key={certificate.url} className="inline-link">{certificate.title}</ExternalLink>) : 'Копии сертификатов будут добавлены.'}</dd></div><div><dt>Подход</dt><dd>Личное внимание, спокойный темп, уважение к ощущениям и границам.</dd></div></dl>
              </Disclosure>
            </div>
          </div>
        </section>

        <section id="requests" className="section requests-section" aria-labelledby="requests-heading">
          <div className="shell"><div className="requests-layout">
            <div className="section-intro" data-reveal><p className="eyebrow">С ЧЕМ МОЖНО ОБРАТИТЬСЯ</p><h2 id="requests-heading">Когда телу<br />нужно <em>внимание</em></h2><p>Не обязательно знать название практики. Начнём с вашего запроса и того, как вы себя чувствуете.</p><a href="#sessions" className="text-link">Посмотреть форматы<Icon name="arrow" /></a></div>
            <ul className="requests-grid" data-reveal>{requests.map((item, index) => <li key={item.title}><span className="item-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></li>)}</ul>
          </div><MedicalNote /></div>
        </section>

        <section id="sessions" className="section sessions-section" aria-labelledby="sessions-heading">
          <div className="shell">
            <div className="section-heading-row" data-reveal><div><p className="eyebrow">ФОРМАТЫ И СТОИМОСТЬ</p><h2 id="sessions-heading">Выберите время <em>для себя</em></h2></div><p>Три формата индивидуальной работы.<br />Если сомневаетесь, начнём с разговора.</p></div>
            <div className="services-list" data-reveal>{services.map((service) => {
              const open = activeService === service.id;
              return <article className={`service-item ${open ? 'is-open' : ''}`} key={service.id}>
                <h3><button type="button" className="service-toggle" aria-expanded={open} aria-controls={`service-${service.id}`} onClick={() => setActiveService(open ? null : service.id)}><span className="item-number">{service.number}</span><span className="service-title-group"><span className="service-title">{service.title}</span><span className="service-format">{service.format}</span></span><span className="service-duration">{service.duration}</span><span className="service-price">{service.price}</span><span className="service-plus"><Icon name="plus" /></span></button></h3>
                <div id={`service-${service.id}`} className="disclosure-panel" aria-hidden={!open} inert={!open}><div><div className="service-details"><div><p>{service.description}</p><p>{service.detail}</p></div><div className="service-book"><p>{service.note}</p><BookingLink className="button-small">Записаться</BookingLink></div></div></div></div>
              </article>;
            })}</div>
            <Disclosure title="Перед записью: ограничения и противопоказания" className="contraindications-disclosure"><p>По информации специалиста, сеансы не проводятся при следующих состояниях:</p><ul className="contraindications-list">{contraindications.map((item) => <li key={item}>{item}</li>)}</ul><p className="small-print">Это ограничения практики, предоставленные специалистом, а не универсальная медицинская рекомендация. При сомнениях предварительно обратитесь к лечащему врачу. Отсутствие состояния в этом списке не подтверждает безопасность сеанса именно для вас.</p></Disclosure>
          </div>
        </section>

        <section id="process" className="section process-section" aria-labelledby="process-heading"><div className="shell"><div className="centered-heading" data-reveal><p className="eyebrow">СПОКОЙНО. ПОШАГОВО. ВМЕСТЕ.</p><h2 id="process-heading">Как проходит <em>наша встреча</em></h2><p>От первого разговора до обсуждения впечатлений. В вашем темпе.</p></div><ol className="process-steps" data-reveal>{steps.map((step, index) => <li key={step.title}><div className="step-marker"><span>0{index + 1}</span><span className="step-line" /></div><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></div></section>

        <section className="section philosophy-section" aria-labelledby="philosophy-heading"><div className="shell"><div className="philosophy-heading" data-reveal><div><p className="eyebrow">ПОЧЕМУ ИНДИВИДУАЛЬНЫЙ ПОДХОД</p><h2 id="philosophy-heading">В центре работы: <em>вы</em></h2></div><p>У каждого свой запрос, опыт и чувствительность.<br />Это важно учитывать.</p></div><dl className="principles-grid" data-reveal>{principles.map((principle, index) => <div key={principle.title}><span className="item-number">0{index + 1}</span><dt>{principle.title}</dt><dd>{principle.text}</dd></div>)}</dl></div></section>

        <section id="space" className="section space-section" aria-labelledby="space-heading">
          <div className="shell space-grid">
            <div className="space-copy" data-reveal><p className="eyebrow">ПРОСТРАНСТВО</p><h2 id="space-heading">Место, где можно <em>выдохнуть</em></h2><p className="space-name">Aurelspa<span>НОВОСИБИРСК</span></p><p>Встречаемся на улице Покатной, 130/1. Спокойное пространство для индивидуальной работы и внимания к себе.</p><address className="space-address"><Icon name="pin" /><span>г. Новосибирск,<br />ул. Покатная, 130/1, Aurelspa</span></address><CopyButton /><div className="map-links"><ExternalLink href={practice.yandex} className="text-link">Яндекс Карты<Icon name="arrow-up" /></ExternalLink><ExternalLink href={practice.twoGis} className="text-link">2ГИС<Icon name="arrow-up" /></ExternalLink></div><p className="space-note">Приём по предварительной записи.</p></div>
            <div className="space-gallery" data-reveal>
              <button type="button" className="gallery-photo-button" aria-label={`Увеличить фотографию пространства ${galleryIndex + 1}`} onClick={() => setModal('gallery')}><Photo key={galleryIndex} photo={spacePhotos[galleryIndex]} className="space-photo" sizes="(max-width: 760px) 100vw, 52vw" /><span className="gallery-expand"><Icon name="expand" /></span></button>
              <div className="gallery-toolbar"><span className="gallery-counter" aria-live="polite">0{galleryIndex + 1}<span> / 0{spacePhotos.length}</span></span><div className="gallery-dots" aria-label="Выбрать фотографию">{spacePhotos.map((photo, index) => <button type="button" key={photo.original} className={index === galleryIndex ? 'is-active' : ''} onClick={() => setGalleryIndex(index)} aria-label={`Фотография ${index + 1}`} aria-pressed={index === galleryIndex}><span /></button>)}</div><div className="gallery-arrows"><button type="button" className="icon-button" aria-label="Предыдущая фотография" onClick={() => nextPhoto(-1)}><Icon name="left" /></button><button type="button" className="icon-button" aria-label="Следующая фотография" onClick={() => nextPhoto(1)}><Icon name="arrow" /></button></div></div>
            </div>
          </div>
        </section>

        <section id="reviews" className="section reviews-section" aria-labelledby="reviews-heading"><div className="shell review-inner" data-reveal><p className="eyebrow">ОТЗЫВЫ</p><h2 id="reviews-heading">О внимании <em>и доверии</em></h2><div className="quote-mark" aria-hidden="true">“</div><figure className="review-quote"><blockquote>{review.quote}</blockquote><figcaption><span className="review-author">{review.author}</span><ExternalLink href={review.source}>{review.caption}<Icon name="arrow-up" /></ExternalLink></figcaption></figure><ExternalLink href={practice.reviews} className="text-link reviews-link">Читать отзывы в Telegram<Icon name="arrow-up" /></ExternalLink><p className="review-disclaimer">Отзывы отражают личные впечатления и не гарантируют аналогичного результата.</p></div></section>

        <section id="faq" className="section faq-section" aria-labelledby="faq-heading"><div className="shell faq-grid"><div className="section-intro" data-reveal><p className="eyebrow">ПЕРЕД ПЕРВОЙ ВСТРЕЧЕЙ</p><h2 id="faq-heading">Возможно,<br />вы <em>хотите узнать</em></h2><p>Ответы на частые вопросы. Если вашего вопроса здесь нет, напишите мне.</p><ExternalLink href={practice.telegram} className="text-link">Задать свой вопрос<Icon name="arrow-up" /></ExternalLink></div><div className="faq-list" data-reveal>{faqs.map((faq, index) => <Disclosure key={faq.question} title={faq.question} defaultOpen={index === 0}><p>{faq.answer}</p>{index === 3 && <ExternalLink href={practice.booking} className="text-link">Перейти к онлайн-записи<Icon name="arrow-up" /></ExternalLink>}</Disclosure>)}</div></div></section>

        <section id="contacts" className="section contact-section" aria-labelledby="contact-heading"><div className="shell contact-grid"><div className="contact-copy" data-reveal><p className="eyebrow">ПЕРВОЕ ЗНАКОМСТВО</p><h2 id="contact-heading">Начните<br /><em>с разговора</em></h2><p className="contact-description">Если вы хотите уделить внимание своему состоянию, позвоните Владимиру и обсудите свой запрос.</p><a className="contact-phone" href={practice.phoneHref}>{practice.phone}<Icon name="arrow-up" /></a><div className="messenger-links"><ExternalLink href={practice.telegram}>Написать в Telegram<Icon name="arrow-up" /></ExternalLink><ExternalLink href={practice.max}>Написать в MAX<Icon name="arrow-up" /></ExternalLink></div><BookingLink /><address className="contact-address"><Icon name="pin" /><span>{practice.address}</span></address><CopyButton /></div><div data-reveal><ContactForm onLegal={() => openLegal('consent')} /></div></div></section>
      </main>

      <footer className="site-footer"><div className="shell"><div className="footer-main"><Wordmark /><div className="footer-address"><span>{practice.address}</span><small>Частная практика кинезиолога в Новосибирске</small></div><a className="footer-call" href={practice.phoneHref}><Icon name="phone" /><span>{practice.phone}<small>Позвонить Владимиру</small></span></a></div><div className="footer-bottom"><p>© {new Date().getFullYear()} {practice.name}</p><div className="legal-links"><button type="button" onClick={() => openLegal('privacy')}>Политика конфиденциальности</button><button type="button" onClick={() => openLegal('consent')}>Обработка персональных данных</button></div><a href="#home" className="back-to-top">Наверх<Icon name="arrow-up" /></a></div><p className="footer-disclaimer">{medicalDisclaimer}</p></div></footer>

      <div className={`mobile-booking-bar ${pastHero ? 'is-visible' : ''}`} inert={!pastHero} aria-hidden={!pastHero}><a href={practice.phoneHref} className="mobile-call" aria-label={`Позвонить: ${practice.phone}`}><Icon name="phone" /></a><BookingLink>Записаться на сеанс</BookingLink></div>

      {modal === 'menu' && <Modal onClose={() => setModal(null)} titleId="menu-title" variant="menu-modal"><p id="menu-title" className="eyebrow">ЧАСТНАЯ ПРАКТИКА</p><Wordmark onClick={() => setModal(null)} /><nav aria-label="Мобильная навигация">{[...navigation, { label: 'Пространство', href: '#space' }, { label: 'Частые вопросы', href: '#faq' }].map((item) => <a href={item.href} key={item.href} onClick={() => setModal(null)}>{item.label}<Icon name="arrow-up" /></a>)}</nav><BookingLink /><a href={practice.phoneHref} className="menu-phone">{practice.phone}</a><p className="menu-address">{practice.address}</p></Modal>}
      {(modal === 'privacy' || modal === 'consent') && <Modal onClose={() => setModal(null)} titleId="legal-title"><LegalContent kind={modal} /></Modal>}
      {modal === 'gallery' && <Modal onClose={() => setModal(null)} titleId="gallery-title" variant="lightbox" onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); nextPhoto(event.key === 'ArrowRight' ? 1 : -1); } }}><h2 className="sr-only" id="gallery-title">Фотографии пространства Aurelspa</h2><Photo key={galleryIndex} photo={spacePhotos[galleryIndex]} className="lightbox-photo" full eager /><div className="lightbox-toolbar"><button type="button" className="icon-button" onClick={() => nextPhoto(-1)} aria-label="Предыдущая фотография"><Icon name="left" /></button><p aria-live="polite">Aurelspa<span>{galleryIndex + 1} / {spacePhotos.length}</span></p><button type="button" className="icon-button" onClick={() => nextPhoto(1)} aria-label="Следующая фотография"><Icon name="arrow" /></button></div></Modal>}
    </>
  );
}
