// L'URL officielle pour obtenir les résultats des courses de la saison 2026
// On garde limit=1000 pour être sûr de charger toutes les données d'un coup
const url = "https://api.jolpi.ca/ergast/f1/2026/results.json?limit=1000";

fetch(url)
    .then(reponse => reponse.json())
    .then(data => {
        // On récupère notre conteneur HTML principal
        const conteneur = document.getElementById("conteneur-courses");
        conteneur.innerHTML = ""; // On efface le message de chargement

        // On récupère le tableau de toutes les courses disponibles pour 2026
        const courses = data.MRData.RaceTable.Races;

        // BOUCLE 1 : On passe en revue chaque Grand Prix
        courses.forEach(course => {
            
            // 1. Création d'un bloc (div) pour la course avec son titre
            const sectionCourse = document.createElement("div");
            sectionCourse.innerHTML = `<h2>Grand Prix : ${course.raceName} (Round ${course.round})</h2>`;
            
            // 2. Création de la liste (<ul>) pour accueillir les pilotes
            const listePilotes = document.createElement("ul");

            // On récupère TOUS les résultats de cette course
            const resultats = course.Results;

            // BOUCLE 2 : On affiche TOUS les pilotes sans aucune coupure (.slice)
            resultats.forEach(pilote => {
                const ligne = document.createElement("li");
                
                // Extraction des données de l'API
                const pos = pilote.position;
                const nom = `${pilote.Driver.givenName} ${pilote.Driver.familyName}`;
                const ecurie = pilote.Constructor.name;
                const points = pilote.points;

                // On remplit la ligne HTML brute
                ligne.innerText = `${pos}. ${nom} (${ecurie}) — ${points} pts`;
                
                // On ajoute le pilote à la liste du Grand Prix
                listePilotes.appendChild(ligne);
            });

            // 3. On assemble les éléments dans le DOM
            sectionCourse.appendChild(listePilotes);
            conteneur.appendChild(sectionCourse);
        });
    })
    .catch(erreur => {
        console.error("Erreur lors de l'appel API :", erreur);
        const conteneur = document.getElementById("conteneur-courses");
        conteneur.innerHTML = "<p>Erreur de connexion avec les stands (API inaccessible).</p>";
    });