import { Link } from "react-router-dom";

function Figure({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  // ✅ background-image evita el ícono roto si falta la imagen
  return (
    <div
      className={`pub-figure ${className}`}
      role="img"
      aria-label={alt}
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}

export default function PublicAbout() {
  return (
    <section className="pub-container">
      {/* HERO */}
      <div className="pub-about-hero">
        <div className="pub-about-hero__content">
          <div className="pub-about-kicker">
            <span className="pub-about-kicker__dot" />
            <span>CLUB DE BOX • EL TIGRE</span>
          </div>

          <h1 className="pub-about-title">
            Sobre <span className="pub-about-accent">Nosotros</span>
          </h1>

          <p className="pub-about-lead">
            Somos una escuela que forma deportistas y personas. Aquí se entrena con disciplina,
            técnica y valores, construyendo carácter dentro y fuera del ring.
          </p>

          <div className="pub-about-actions">
            {/* ✅ ÚNETE ahora va a LOGIN */}
            <Link className="pub-btn pub-btn--accent" to="/login">
              Únete hoy
            </Link>

            <Link className="pub-btn pub-btn--outline" to="/contacto">
              Ver horarios
            </Link>
          </div>

          <div className="pub-about-mini">
            <span>✅ Disciplina</span>
            <span>✅ Resiliencia</span>
            <span>✅ Familia</span>
          </div>
        </div>

        <Figure
          src="/about/about-hero.jpg"
          alt="Entrenamiento de box"
          className="pub-about-hero__media"
        />
      </div>

      {/* HISTORIA */}
      <div className="pub-section">
        <div className="pub-section__head">
          <h2 className="pub-section__title">Historia de Fundación</h2>
          <p className="pub-section__text">
            Lo que empezó con una necesidad familiar y un propósito, se convirtió en un club que hoy
            inspira a Huancayo.
          </p>
        </div>

        <div className="pub-grid pub-grid--2">
          <div className="pub-card">
            <h3 className="pub-card__title">El Origen: Una Madre y una Misión</h3>
            <p className="pub-card__text">
              La historia del Club de Boxeo El Tigre nace en el corazón de una madre: canalizar la
              energía de un niño hiperactivo hacia una disciplina que transforme ímpetu en fuerza.
              En el camino, se encontró algo más grande: un propósito.
            </p>

            <div className="pub-card__divider" />

            <h3 className="pub-card__title">El Encuentro y la Alianza</h3>
            <p className="pub-card__text">
              En su centro de labores, el destino cruzó caminos con “El Tigre”. No solo sería
              cofundador: su espíritu y trayectoria inspiraron el nombre y la identidad de esta casa
              de campeones. Compartían una ilusión enorme y ganas de comerse el mundo.
            </p>
          </div>

          <Figure
            src="/about/founders.jpg"
            alt="Fundadores del Club"
            className="pub-figure--tall"
          />
        </div>

        <div className="pub-grid pub-grid--3 pub-mt">
          <div className="pub-card pub-card--soft">
            <div className="pub-tag">Humildad y coraje</div>
            <p className="pub-card__text">
              Iniciamos con lo mínimo: un saco, tres pares de guantes, dos cabezales… y mucha fe.
              Lo que faltaba en equipamiento, sobraba en corazón.
            </p>
          </div>

          <div className="pub-card pub-card--soft">
            <div className="pub-tag">Prueba de fuego</div>
            <p className="pub-card__text">
              Hubo un quiebre duro cuando dos socios se retiraron por motivos personales. Fue un
              golpe bajo, pero el club decidió levantarse y seguir.
            </p>
          </div>

          <div className="pub-card pub-card--soft">
            <div className="pub-tag">El Tigre hoy</div>
            <p className="pub-card__text">
              Hoy El Tigre es uno de los clubes más reconocidos de Huancayo: semillero de disciplina,
              fuerza y valores.
            </p>
          </div>
        </div>
      </div>

      {/* MISIÓN / VISIÓN */}
      <div className="pub-section">
        <div className="pub-grid pub-grid--2">
          <div className="pub-card pub-card--glow">
            <h2 className="pub-section__title">Misión</h2>
            <p className="pub-card__text">
              Somos más que un gimnasio; somos una familia. Acogemos a niños, adolescentes y adultos
              para formarlos como atletas y como personas íntegras. Enseñamos técnica, disciplina y
              perseverancia, y guiamos a las nuevas generaciones a través del ejemplo y orientación
              espiritual enfocada en Dios. No solo se aprende a golpear; se aprende a enfrentar la vida.
            </p>

            <div className="pub-about-actions" style={{ marginTop: 14 }}>
              <Link className="pub-btn pub-btn--accent" to="/login">
                Únete (Login)
              </Link>
              <Link className="pub-btn pub-btn--outline" to="/contacto">
                Contacto
              </Link>
            </div>
          </div>

          <div className="pub-card">
            <h2 className="pub-section__title">Visión</h2>
            <p className="pub-card__text">
              Ser reconocidos en Huancayo y en todo el país como una cuna de campeones deportivos y un
              espacio de transformación social. Un refugio donde la juventud encuentre dirección y propósito,
              una comunidad unida por la fe y el deporte.
            </p>
          </div>
        </div>
      </div>

      {/* VALORES */}
      <div className="pub-section">
        <div className="pub-section__head">
          <h2 className="pub-section__title">El ADN del Tigre</h2>
          <p className="pub-section__text">
            Valores que entrenamos todos los días, dentro y fuera del ring.
          </p>
        </div>

        <div className="pub-grid pub-grid--4">
          <div className="pub-card pub-card--soft">
            <div className="pub-icon">🙏</div>
            <h3 className="pub-card__title">Fe</h3>
            <p className="pub-card__text">Dios como piedra angular en nuestros procesos.</p>
          </div>

          <div className="pub-card pub-card--soft">
            <div className="pub-icon">🤝</div>
            <h3 className="pub-card__title">Familia</h3>
            <p className="pub-card__text">Aquí nadie pelea solo; nos cuidamos y apoyamos.</p>
          </div>

          <div className="pub-card pub-card--soft">
            <div className="pub-icon">🧭</div>
            <h3 className="pub-card__title">Integridad</h3>
            <p className="pub-card__text">Primero personas correctas, luego atletas fuertes.</p>
          </div>

          <div className="pub-card pub-card--soft">
            <div className="pub-icon">🦁</div>
            <h3 className="pub-card__title">Resiliencia</h3>
            <p className="pub-card__text">Nos levantamos ante cada caída. Siempre.</p>
          </div>
        </div>
      </div>

      {/* ENTRENADORES (REFERENCIAL) */}
      <div className="pub-section">
        <div className="pub-section__head">
          <h2 className="pub-section__title">Entrenadores</h2>
          <p className="pub-section__text">
            (Referencial) Luego tú actualizas nombres, fotos y especialidades.
          </p>
        </div>

        <div className="pub-grid pub-grid--3">
          <div className="pub-card pub-coach">
            <Figure src="/about/coach-1.jpg" alt="Entrenador 1" className="pub-coach__img" />
            <div className="pub-coach__body">
              <div className="pub-tag">Técnica</div>
              <h3 className="pub-card__title">Coach Principal</h3>
              <p className="pub-card__text">Boxeo técnico, fundamentos, guardia y defensa.</p>
            </div>
          </div>

          <div className="pub-card pub-coach">
            <Figure src="/about/coach-2.jpg" alt="Entrenador 2" className="pub-coach__img" />
            <div className="pub-coach__body">
              <div className="pub-tag">Acondicionamiento</div>
              <h3 className="pub-card__title">Coach Físico</h3>
              <p className="pub-card__text">Resistencia, potencia, movilidad y disciplina.</p>
            </div>
          </div>

          <div className="pub-card pub-coach">
            <Figure src="/about/coach-3.jpg" alt="Entrenador 3" className="pub-coach__img" />
            <div className="pub-coach__body">
              <div className="pub-tag">Juventud</div>
              <h3 className="pub-card__title">Mentoría</h3>
              <p className="pub-card__text">Acompañamiento y orientación para jóvenes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TEMA TIGRE / CHARLAS */}
      <div className="pub-section">
        <div className="pub-grid pub-grid--2">
          <Figure src="/about/youth-talks.jpg" alt="Charlas a jóvenes" className="pub-figure--tall" />

          <div className="pub-card">
            <h2 className="pub-section__title">Tema Tigre: Charlas a jóvenes</h2>
            <p className="pub-card__text">
              Motivamos a niños y adolescentes a tomar decisiones correctas. El deporte se vuelve un
              camino de orden, enfoque y propósito. Aquí se entrena la mente igual que el cuerpo.
            </p>

            <div className="pub-card__divider" />

            <p className="pub-card__text">
              Si quieres que visitemos tu colegio o grupo juvenil con una charla + demostración, escríbenos.
            </p>

            <div className="pub-about-actions">
              <Link className="pub-btn pub-btn--outline" to="/contacto">
                Contáctanos
              </Link>

              <Link className="pub-btn pub-btn--accent" to="/login">
                Únete (Login)
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="pub-cta">
        <div className="pub-cta__inner">
          <h2 className="pub-cta__title">
            ¿Listo para entrenar como un <span className="pub-about-accent">Tigre</span>?
          </h2>
          <p className="pub-cta__text">
            Únete y empieza tu proceso: disciplina, técnica y progreso real.
          </p>

          <div className="pub-about-actions">
            <Link className="pub-btn pub-btn--accent" to="/login">
              Únete ahora
            </Link>

            <Link className="pub-btn pub-btn--outline" to="/contacto">
              Ver horarios
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
