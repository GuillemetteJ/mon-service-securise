import { brancheAjoutItem } from './saisieListeItems.js';

const brancheElementsAjoutables = (nom, valeurExemple = '') => {
  const calculeIndexMax = (selecteurDuConteneur) => $(selecteurDuConteneur).children().length - 1;

  const selecteurConteneur = `#${nom}`;
  const selecteurLienAjout = `#nouveaux-${nom}`;
  let indexMax = calculeIndexMax(selecteurConteneur);

  const templateZoneSaisie = (nomElement, valeurExempleElement) => (index, { description = '' }) => `
    <input
      id="description-${nomElement}-${index}"
      name="description-${nomElement}-${index}"
      type="text"
      value="${description}"
      placeholder="${valeurExempleElement}"
    >
  `;

  brancheAjoutItem(
    selecteurLienAjout,
    selecteurConteneur,
    (index) => templateZoneSaisie(nom, valeurExemple)(index, {}),
    () => (indexMax += 1)
  );
};

export default brancheElementsAjoutables;
