import { useMemo, useState } from "react";

function Figure({ src, alt }: { src: string; alt: string }) {
  // background-image evita “imagen rota” si aún no existe
  return (
    <div
      className="pub-figure pub-contact-figure"
      role="img"
      aria-label={alt}
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}

export default function PublicContact() {
  // ✅ Reemplaza estos 2 links con los tuyos
  const MAPS_URL = "https://www.google.com/maps?q=Club%20de%20Box%20El%20Tigre%20Huancayo";
  // Para el iframe: Google Maps > Compartir > Insertar un mapa (embed)
  const MAPS_EMBED_URL =
    "https://www.google.com/maps?output=embed&q=Club%20de%20Box%20El%20Tigre%20Huancayo";

  // ✅ Reemplaza con tu número (formato internacional). Ej Perú: 51 + 9xxxxxxxx
  const WHATSAPP_NUMBER = "51947637782";

  const categories = useMemo(
    () => [
      "Box Kids (Niños)",
      "Box Teens (Adolescentes)",
      "Box Adultos",
      "Defensa Personal",
      "Competencia",
      "Acondicionamiento",
    ],
    []
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const waLink = (text: string) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (!name.trim() || cleanPhone.length < 8) {
      alert("Por favor completa tu nombre y un celular válido.");
      return;
    }

    const message =
      `Hola, soy ${name}. Quiero solicitar mi *Clase de Cortesía GRATIS* en el Club de Box *El Tigre*.\n` +
      `📱 Celular: ${cleanPhone}\n` +
      `🥊 Categoría de interés: ${category}\n` +
      `¿Qué horarios tienen disponibles?`;

    window.open(waLink(message), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="pub-container pub-contact">
      {/* Encabezado */}
      <div className="pub-contact-head">
        <div className="pub-about-kicker">
          <span className="pub-about-kicker__dot" />
          <span>CLUB DE BOX • EL TIGRE • HUANCAYO</span>
        </div>

        <h1 className="pub-contact-title">
          Tu entrenamiento empieza <span className="pub-about-accent">hoy</span>
        </h1>

        <p className="pub-contact-lead">
          Escríbenos para horarios, inscripción y tu <b>Clase de Cortesía GRATIS</b>.
          Te respondemos rápido por WhatsApp.
        </p>

        <div className="pub-contact-actions">
          <a className="pub-btn pub-btn--accent" href={waLink("Hola, deseo información del Club de Box El Tigre.")} target="_blank" rel="noreferrer">
            WhatsApp ahora
          </a>

          <a className="pub-btn pub-btn--outline" href={MAPS_URL} target="_blank" rel="noreferrer">
            Ver en Google Maps
          </a>
        </div>
      </div>

      {/* Grid principal: Mapa + Referencias/Horarios */}
      <div className="pub-grid pub-grid--2 pub-section">
        <div className="pub-card pub-contact-map">
          <div className="pub-contact-map__top">
            <h2 className="pub-section__title">Cómo ubicarnos</h2>
            <a className="pub-btn pub-btn--outline pub-btn--sm" href={MAPS_URL} target="_blank" rel="noreferrer">
              Abrir ruta
            </a>
          </div>

          <p className="pub-section__text">
            Referencias (edítalas a tu gusto):
          </p>

          <ul className="pub-contact-list">
            <li>📍 Estamos a <b>A Unos Pasos del Parque Constitución</b>.</li>
            <li>🚌 Cerca de rutas principales y zonas conocidas de Huancayo.</li>
            <li>🏷️ Busca en Google: <b>“Club de Box El Tigre”</b>.</li>
          </ul>

          <div className="pub-contact-iframeWrap">
            <iframe
              title="Mapa Club de Box El Tigre"
              src={MAPS_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="pub-contact-note">
            Tip: En Google Maps → “Compartir” → copia el enlace o “Insertar un mapa” para el embed.
          </div>
        </div>

        <div className="pub-card pub-contact-hours">
          <h2 className="pub-section__title">Horarios de atención</h2>
          <p className="pub-section__text">
            Atención al cliente por WhatsApp y en el club (ajústalo a tu realidad).
          </p>

          <div className="pub-hours-grid">
            <div className="pub-hours-item">
              <div className="pub-tag">Lun – Vie</div>
              <div className="pub-hours-time">6:00 am – 10:00 pm</div>
              <div className="pub-hours-muted">Entrenamientos + informes</div>
            </div>

            <div className="pub-hours-item">
              <div className="pub-tag">Sábados</div>
              <div className="pub-hours-time">7:00 am – 7:00 pm</div>
              <div className="pub-hours-muted">Incluye tarde</div>
            </div>

            <div className="pub-hours-item">
              <div className="pub-tag">Domingos / Feriados</div>
              <div className="pub-hours-time">Consultar</div>
              <div className="pub-hours-muted">Respondemos por WhatsApp</div>
            </div>
          </div>

          <div className="pub-card__divider" />

          <div className="pub-contact-quick">
            <div className="pub-contact-quick__item">
              <div className="pub-contact-quick__label">📞 WhatsApp</div>
              <a className="pub-contact-quick__value" href={waLink("Hola, deseo información del Club de Box El Tigre.")} target="_blank" rel="noreferrer">
                +{WHATSAPP_NUMBER}
              </a>
            </div>

            <div className="pub-contact-quick__item">
              <div className="pub-contact-quick__label">🧭 Ubicación</div>
              <a className="pub-contact-quick__value" href={MAPS_URL} target="_blank" rel="noreferrer">
                Abrir en Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Galería real (para encontrar por imágenes) */}
      <div className="pub-section">
        <div className="pub-section__head">
          <h2 className="pub-section__title">Así nos encuentras (imágenes reales)</h2>
          <p className="pub-section__text">
            Reemplaza estas fotos por las reales del club: fachada, entrada, área de trabajo, materiales, oficina.
          </p>
        </div>

        <div className="pub-grid pub-grid--3 pub-contact-gallery">
          <div className="pub-card pub-gallery-card">
            <Figure src="/contact/fachada.jpg" alt="Fachada del club" />
            <div className="pub-gallery-caption">Fachada / Letrero</div>
          </div>

          <div className="pub-card pub-gallery-card">
            <Figure src="/contact/entrada.jpg" alt="Entrada del club" />
            <div className="pub-gallery-caption">Entrada / Recepción</div>
          </div>

          <div className="pub-card pub-gallery-card">
            <Figure src="/contact/area-entreno.jpg" alt="Área de entrenamiento" />
            <div className="pub-gallery-caption">Área de entrenamiento</div>
          </div>

          <div className="pub-card pub-gallery-card">
            <Figure src="/contact/ring.jpg" alt="Ring o zona de sparring" />
            <div className="pub-gallery-caption">Ring / Sparring</div>
          </div>

          <div className="pub-card pub-gallery-card">
            <Figure src="/contact/guantes.jpg" alt="Materiales y guantes" />
            <div className="pub-gallery-caption">Materiales / Guantes</div>
          </div>

          <div className="pub-card pub-gallery-card">
            <Figure src="/contact/oficina.jpg" alt="Oficina e informes" />
            <div className="pub-gallery-caption">Oficina / Informes</div>
          </div>
        </div>
      </div>

      {/* Formulario Clase de Cortesía */}
      <div className="pub-cta pub-section" id="clase-cortesia">
        <div className="pub-cta__inner">
          <h2 className="pub-cta__title">
            Solicita tu primera <span className="pub-about-accent">Clase GRATIS</span>
          </h2>
          <p className="pub-cta__text">
            Completa tus datos y te abrimos WhatsApp con el mensaje listo. Solo envías y listo.
          </p>

          <form className="pub-form" onSubmit={onSubmit}>
            <div className="pub-form-grid">
              <label className="pub-field">
                <span className="pub-field__label">Nombre</span>
                <input
                  className="pub-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </label>

              <label className="pub-field">
                <span className="pub-field__label">Celular</span>
                <input
                  className="pub-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 947 637 782"
                  inputMode="tel"
                />
              </label>

              <label className="pub-field pub-field--full">
                <span className="pub-field__label">Categoría de interés</span>
                <select
                  className="pub-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pub-form-actions">
              <button className="pub-btn pub-btn--accent" type="submit">
                Enviar solicitud por WhatsApp
              </button>

              <a className="pub-btn pub-btn--outline" href={MAPS_URL} target="_blank" rel="noreferrer">
                Ver ubicación
              </a>
            </div>

            <div className="pub-form-note">
              * Al enviar, se abrirá WhatsApp con el mensaje prearmado. No guardamos datos (por ahora).
            </div>
          </form>
        </div>
      </div>

      {/* Botón flotante WhatsApp */}
      <a
        className="pub-wa-float"
        href={waLink("Hola, deseo información del Club de Box El Tigre.")}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        title="WhatsApp"
      >
        WA
      </a>
    </section>
  );
}
