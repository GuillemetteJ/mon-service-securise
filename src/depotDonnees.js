const bcrypt = require('bcrypt');

const { ErreurUtilisateurExistant } = require('./erreurs');
const Homologation = require('./modeles/homologation');
const Utilisateur = require('./modeles/utilisateur');

const creeDepot = (donnees, { adaptateurJWT, adaptateurUUID, referentiel }) => {
  const homologation = (idHomologation) => {
    const donneesHomologation = donnees.homologations.find((h) => h.id === idHomologation);
    return donneesHomologation ? new Homologation(donneesHomologation, referentiel) : undefined;
  };

  const homologations = (idUtilisateur) => donnees.homologations
    .filter((h) => h.idUtilisateur === idUtilisateur)
    .map((h) => new Homologation(h, referentiel));

  const nouvelleHomologation = (idUtilisateur, donneesHomologation) => {
    donneesHomologation.id = adaptateurUUID.genereUUID();
    donneesHomologation.idUtilisateur = idUtilisateur;
    donnees.homologations.push(donneesHomologation);

    return donneesHomologation.id;
  };

  const nouvelUtilisateur = (donneesUtilisateur) => {
    const utilisateurExiste = (email) => !!(donnees.utilisateurs.find((u) => u.email === email));

    if (utilisateurExiste(donneesUtilisateur.email)) throw new ErreurUtilisateurExistant();

    donneesUtilisateur.id = adaptateurUUID.genereUUID();
    return bcrypt.hash(donneesUtilisateur.motDePasse, 10)
      .then((hash) => {
        donneesUtilisateur.motDePasse = hash;
        donnees.utilisateurs.push(donneesUtilisateur);
        return new Utilisateur(donneesUtilisateur, adaptateurJWT);
      });
  };

  const utilisateur = (identifiant) => {
    const donneesUtilisateur = donnees.utilisateurs.find((u) => u.id === identifiant);
    return donneesUtilisateur ? new Utilisateur(donneesUtilisateur, adaptateurJWT) : undefined;
  };

  const utilisateurAuthentifie = (login, motDePasse) => {
    const donneesUtilisateur = donnees.utilisateurs.find((u) => u.email === login);
    const motDePasseStocke = donneesUtilisateur && donneesUtilisateur.motDePasse;
    const echecAuthentification = undefined;

    if (!motDePasseStocke) return new Promise((resolve) => resolve(echecAuthentification));

    return bcrypt.compare(motDePasse, motDePasseStocke)
      .then((authentificationReussie) => (authentificationReussie
        ? new Utilisateur(donneesUtilisateur, adaptateurJWT)
        : echecAuthentification
      ))
      .catch((error) => error);
  };

  return {
    homologation,
    homologations,
    nouvelleHomologation,
    nouvelUtilisateur,
    utilisateur,
    utilisateurAuthentifie,
  };
};

const creeDepotVide = () => creeDepot({ utilisateurs: [], homologations: [] }, {});

module.exports = { creeDepot, creeDepotVide };