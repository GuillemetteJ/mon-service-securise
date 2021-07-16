const expect = require('expect.js');
const Middleware = require('../src/middleware');

const prepareVerificationReponse = (reponse, status, ...params) => {
  let message;
  let suite;

  if (params.length === 1) [suite] = params;
  if (params.length === 2) [message, suite] = params;

  reponse.status = (s) => {
    expect(s).to.equal(status);
    return reponse;
  };

  reponse.send = (m) => {
    if (typeof message !== 'undefined') expect(m).to.equal(message);
    suite();
  };
};

describe('Le middleware MSS', () => {
  const requete = {};
  const reponse = {};

  beforeEach(() => {
    requete.session = { token: 'XXX' };
    requete.params = {};

    reponse.redirect = () => {};
    reponse.set = () => {};
    reponse.status = () => reponse;
    reponse.send = () => {};
  });

  it("redirige l'utilisateur vers la mire de login quand échec vérification JWT", (done) => {
    const adaptateurJWT = {
      decode: (token) => {
        expect(token).to.equal('XXX');
      },
    };

    const middleware = Middleware({ adaptateurJWT });

    reponse.redirect = (url) => {
      expect(url).to.equal('/connexion');
      done();
    };

    middleware.verificationJWT(requete, reponse);
  });

  it('efface les cookies sur demande', (done) => {
    expect(requete.session).to.not.be(null);

    const middleware = Middleware();
    middleware.suppressionCookie(requete, reponse, () => {
      expect(requete.session).to.be(null);
      done();
    });
  });

  describe('sur authentification basique', () => {
    it('retourne une erreur HTTP 401 et demande un challenge si échec authentification', (done) => {
      const middleware = Middleware({ login: 'admin', motDePasse: 'password' });

      requete.headers = {};

      reponse.set = (nomHeader, valeurHeader) => {
        expect(nomHeader).to.equal('WWW-Authenticate');
        expect(valeurHeader).to.equal('Basic realm="Administration Mon Service Sécurisé"');
      };

      prepareVerificationReponse(reponse, 401, done);

      middleware.authentificationBasique(requete, reponse, () => done('Exécution suite chaîne inattendue'));
    });

    it('poursuit normalement si succès authentification', (done) => {
      const middleware = Middleware({ login: 'admin', motDePasse: 'password' });

      requete.headers = { authorization: 'Basic YWRtaW46cGFzc3dvcmQ=' }; // admin:password

      middleware.authentificationBasique(requete, reponse, () => {
        expect(requete.auth.user).to.equal('admin');
        expect(requete.auth.password).to.equal('password');
        done();
      });
    });
  });

  describe('sur recherche homologation existante', () => {
    it('requête le dépôt de données', (done) => {
      const depotDonnees = {
        homologation(id) {
          expect(id).to.equal('123');
          done();
        },
      };
      const middleware = Middleware({ depotDonnees });

      requete.params = { id: '123' };
      middleware.trouveHomologation(requete);
    });

    it('renvoie une erreur HTTP 404 si homologation non trouvée', (done) => {
      const depotDonnees = { homologation: () => undefined };
      const middleware = Middleware({ depotDonnees });

      prepareVerificationReponse(reponse, 404, 'Homologation non trouvée', done);

      const suite = () => done("Le middleware suivant n'aurait pas dû être appelé");
      middleware.trouveHomologation(requete, reponse, suite);
    });

    it("renvoie une erreur HTTP 403 si l'utilisateur courant n'a pas accès à l'homologation", (done) => {
      requete.idUtilisateurCourant = 'unIdentifiant';
      const homologation = { idUtilisateur: 'unAutreIdentifiant' };
      const depotDonnees = { homologation: () => homologation };
      const middleware = Middleware({ depotDonnees });

      prepareVerificationReponse(reponse, 403, "Accès à l'homologation refusé", done);

      const suite = () => done("Le middleware suivant n'aurait pas dû être appelé");
      middleware.trouveHomologation(requete, reponse, suite);
    });

    it("retourne l'homologation trouvée et appelle le middleware suivant", (done) => {
      requete.idUtilisateurCourant = '999';
      const homologation = { idUtilisateur: '999' };
      const depotDonnees = { homologation: () => homologation };
      const middleware = Middleware({ depotDonnees });

      middleware.trouveHomologation(requete, reponse, () => {
        expect(requete.homologation).to.equal(homologation);
        done();
      });
    });
  });
});
