const BASE_URL = "https://api.jolpi.ca/ergast/f1/2026/results.json";
const LIMIT = 30; // Limite maximale autorisée par l'API jolpi.ca

async function chargerToutesLesCourses() {
    const conteneur = document.getElementById("conteneur-courses");
    conteneur.innerHTML = "<p>Chargement en cours...</p>";

    try {
        // ---- ÉTAPE 1 : Première requête pour connaître le nombre total de résultats ----
        // L'API nous renvoie un champ "total" qui indique combien de résultats existent au global
        const premiereReponse = await fetch(`${BASE_URL}?limit=${LIMIT}&offset=0`);
        const premierData = await premiereReponse.json();
        const total = parseInt(premierData.MRData.total); // Ex: 132

        // On récupère les 30 premiers résultats déjà présents dans cette première réponse
        let tousLesResultats = premierData.MRData.RaceTable.Races;

        // ---- ÉTAPE 2 : Calcul du nombre de requêtes supplémentaires nécessaires ----
        // Ex: total=132, LIMIT=30 → (132-30)/30 = 3.4 → Math.ceil → 4 requêtes restantes
        const nbRequetesRestantes = Math.ceil((total - LIMIT) / LIMIT);

        // ---- ÉTAPE 3 : On prépare toutes les requêtes suivantes ----
        // Chaque requête utilise un "offset" (décalage) différent pour récupérer la bonne page
        // offset=30 → résultats 31 à 60, offset=60 → résultats 61 à 90, etc.
        const requetes = [];
        for (let i = 1; i <= nbRequetesRestantes; i++) {
            const offset = i * LIMIT;
            requetes.push(
                fetch(`${BASE_URL}?limit=${LIMIT}&offset=${offset}`)
                    .then(r => r.json())
            );
        }

        // ---- ÉTAPE 4 : On envoie toutes les requêtes EN MÊME TEMPS ----
        // Promise.all attend que toutes les requêtes soient terminées avant de continuer
        // C'est bien plus rapide que de les faire une par une
        const autresData = await Promise.all(requetes);
        autresData.forEach(data => {
            tousLesResultats = tousLesResultats.concat(data.MRData.RaceTable.Races);
        });

        // ---- ÉTAPE 5 : Fusion des courses coupées entre deux pages ----
        // Problème : une même course peut apparaître sur deux pages différentes
        // Ex: les 10 premiers pilotes du Canada sont en page 1, les 10 suivants en page 2
        // On utilise une Map avec le numéro de round comme clé pour regrouper tout ça
        const coursesMap = new Map();
        tousLesResultats.forEach(course => {
            if (!coursesMap.has(course.round)) {
                // Première fois qu'on voit ce round : on l'ajoute directement
                coursesMap.set(course.round, course);
            } else {
                // Ce round existe déjà : on fusionne juste la liste des pilotes
                const existante = coursesMap.get(course.round);
                existante.Results = existante.Results.concat(course.Results || []);
            }
        });

        // ---- ÉTAPE 6 : Tri et affichage ----
        // On convertit la Map en tableau et on trie par numéro de round (1, 2, 3...)
        const courses = Array.from(coursesMap.values())
            .sort((a, b) => parseInt(a.round) - parseInt(b.round));

        conteneur.innerHTML = "";

        // BOUCLE 1 : On passe en revue chaque Grand Prix
        courses.forEach(course => {
            const sectionCourse = document.createElement("div");
            sectionCourse.innerHTML = `<h2>Grand Prix : ${course.raceName} (Round ${course.round})</h2>`;

            const listePilotes = document.createElement("ul");
            const resultats = course.Results || [];

            // BOUCLE 2 : On affiche les pilotes de cette course
            resultats.forEach(pilote => {
                const ligne = document.createElement("li");

                // SÉCURITÉ 1 : On vérifie si l'objet Driver existe avant de lire le prénom/nom
                const nomPilote = pilote.Driver
                    ? `${pilote.Driver.givenName} ${pilote.Driver.familyName}`
                    : "Pilote non répertorié";

                // SÉCURITÉ 2 : On vérifie si l'objet Constructor existe avant de lire le nom de l'écurie
                const ecurie = pilote.Constructor
                    ? pilote.Constructor.name
                    : "Écurie inconnue";

                // SÉCURITÉ 3 : Variables de secours simples pour la position et les points
                const pos = pilote.position || "?";
                const points = pilote.points || "0";

                ligne.innerText = `${pos}. ${nomPilote} (${ecurie}) — ${points} pts`;
                listePilotes.appendChild(ligne);
            });

            sectionCourse.appendChild(listePilotes);
            conteneur.appendChild(sectionCourse);
        });

    } catch (erreur) {
        console.error("Erreur lors de l'appel API :", erreur);
        conteneur.innerHTML = "<p>Erreur de connexion avec les stands (API inaccessible).</p>";
    }
}

chargerToutesLesCourses();