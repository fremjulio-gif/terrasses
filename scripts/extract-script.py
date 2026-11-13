#!/usr/bin/env python3
"""
TERRASSES - Dramatic Structure & Cue Extractor
Author: Laurent Gaudé / Terrasses Audio
Usage: python3 scripts/extract-script.py [path_to_pdf]
Default: /Users/fffamily/Documents/TERRASSES/V3 terrasses.pdf
"""

import sys
import os
import json
import re
import pypdf

DEFAULT_PDF_PATH = "/Users/fffamily/Documents/TERRASSES/V3 terrasses.pdf"
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "script-structure.json")

# Musical axes as defined in DT.rtf
MUSICAL_AXES = {
    "act-1": {
        "title": "I. L'Insouciance Fragile",
        "context": "L'Avant : les tables, le vin, l'été",
        "keyMode": "Fa Lydien (sur pédale de Fa) ou Do majeur",
        "tempo": "72 BPM (Pulsation proche du cœur au repos)",
        "chords": "Fmaj7(#11) — G/F (alternance en boucle sans résolution)",
        "vstTools": "Felt piano feutré avec mécanique des touches, ligne mélodique épurée, foley café passe-bas à 400Hz",
        "color": "from-amber-400/20 to-orange-400/20"
    },
    "act-2": {
        "title": "II. Le Hasard & La Sidération",
        "context": "Le Pendant : l'irruption de la voiture, l'attaque",
        "keyMode": "Si Locrien (instabilité absolue et chaos)",
        "tempo": "Tempo libre (Rubato / Arrêt du temps)",
        "chords": "Statique : seconde mineure Si—Do et triton Si—Fa non résolue",
        "vstTools": "Drone basse analogique Buchla, micro-glissandos cordes frottées au chevalet, acouphène 8 kHz et impacts sub",
        "color": "from-rose-500/20 to-red-600/20"
    },
    "act-3": {
        "title": "III. La Fosse & L'Onde de Choc",
        "context": "Le Concert : la fête étouffée par l'horreur / Bataclan & Répondeurs",
        "keyMode": "Sol Phrygien / Ré# mineur",
        "tempo": "124 BPM (Techno industrielle minimale)",
        "chords": "Monorhythme Sol oscillant demi-ton supérieur Ab/G",
        "vstTools": "Sub-kick saturé, basse Serum étouffée filtre passe-bas (perte audition), larsen Tape-201",
        "color": "from-purple-600/20 to-indigo-700/20"
    },
    "act-4": {
        "title": "IV. L'Oratorio de la Fraternité",
        "context": "L'Après : les secours, le deuil, le baiser final",
        "keyMode": "La Dorien / Do mineur",
        "tempo": "60 BPM (Respiration lente, apaisement)",
        "chords": "Am — D/A (Ostinato contemplatif, sixte Fa# illuminant le mineur)",
        "vstTools": "Chœurs Augmented Voices sans paroles en chuchotement, clarinette basse / violon sans vibrato, respirations",
        "color": "from-sky-500/20 to-emerald-500/20"
    }
}

# Known piece cues / composer mappings from COMPO folder
TRACK_SUGGESTIONS = {
    "tessa-rendez-vous": {"track": "sororité_02.wav", "mode": "Fa Lydien - 72 BPM"},
    "erine-barcelone": {"track": "sororité.wav", "mode": "Do majeur - 72 BPM"},
    "helias-jour-banal": {"track": "décu.wav", "mode": "Fa Lydien - 70 BPM"},
    "tessa-attente": {"track": "pianito01.wav", "mode": "Do majeur - 72 BPM"},
    "helias-ecarquiller": {"track": "ecarquiller.wav", "mode": "Si Locrien - Rubato"},
    "paul-spicca": {"track": "spicca.wav", "mode": "Si Locrien - Tension"},
    "tessa-bad": {"track": "bad.wav", "mode": "Si Locrien - 80 BPM"},
    "tessa-reminiscent": {"track": "reminiscent02.wav", "mode": "Ré Dorien - 68 BPM"},
    "tessa-exit": {"track": "exit_01.wav", "mode": "Ré Dorien - 70 BPM"},
    "dorian-urgences": {"track": "apparent_01.wav", "mode": "Sol Phrygien - 110 BPM"},
    "voix-off-repondeurs": {"track": "hallu.wav", "mode": "Sol Phrygien - Atmosphère"},
    "bataclan-danse": {"track": "244bpm_rédorian_ancrage.wav", "mode": "Ré Dorien - 124 BPM"},
    "emilien-standard": {"track": "larmes_ambulances01.wav", "mode": "La Dorien - 60 BPM"},
    "helias-julie": {"track": "remember_01.wav", "mode": "La Dorien - 60 BPM"},
    "tessa-baiser": {"track": "blue01_60to75bpm_rédorian.wav", "mode": "Ré Dorien - 60-75 BPM"}
}


def clean_page_text(raw_text):
    """Normalize weird spacing/newlines in extracted PDF text."""
    # Replace multiple spaces / newlines separating words
    t = re.sub(r'[ \t]*\n[ \t]*', ' ', raw_text)
    t = re.sub(r' +', ' ', t)
    return t.strip()


def extract_script(pdf_path):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found at {pdf_path}")

    reader = pypdf.PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"Reading {pdf_path} ({total_pages} pages)...")

    pages_cleaned = []
    for idx, page in enumerate(reader.pages):
        raw = page.extract_text() or ""
        cleaned = clean_page_text(raw)
        pages_cleaned.append((idx + 1, cleaned))

    # Definitive Act & Scene layout based on Laurent Gaudé's Terrasses & composer notes
    acts = [
        {
            "id": "act-1",
            "number": 1,
            "title": "ACTE I : L'Insouciance Fragile",
            "subtitle": "L'Avant — Les terrasses, le vin, l'amour retardé",
            "pageRange": "Pages 1 – 4",
            "musical": MUSICAL_AXES["act-1"],
            "scenes": [
                {
                    "id": "act-1-sc-1",
                    "number": 1,
                    "title": "Scène 1 : L'Attente & Le Désir",
                    "location": "Terrasse parisienne (Matin & Après-midi)",
                    "characters": ["TESSA", "ERINE", "HELIAS"],
                    "summary": "Tessa s'éveille et savoure l'attente du rendez-vous amoureux. Erine se réjouit de la venue de sa soeur jumelle de Barcelone. Helias commente le cours ordinaire des vies.",
                    "pageStart": 1,
                    "pageEnd": 2
                },
                {
                    "id": "act-1-sc-2",
                    "number": 2,
                    "title": "Scène 2 : Les Sœurs Jumelles & Le Trou Noir",
                    "location": "Terrasse parisienne (Fin de journée)",
                    "characters": ["TESSA", "ERINE", "HELIAS"],
                    "summary": "Le pacte des jumelles à quinze ans. Tessa choisit sa tenue pour charmer. Helias pressent l'abîme qui approche comme un trou noir.",
                    "pageStart": 2,
                    "pageEnd": 3
                },
                {
                    "id": "act-1-sc-3",
                    "number": 3,
                    "title": "Scène 3 : Trouver une Table & Le Baiser Remis",
                    "location": "Terrasse parisienne (Début de soirée)",
                    "characters": ["TESSA", "HELIAS", "PAUL"],
                    "summary": "Trouver une table, commander du vin. Les amoureuses face à face, retardant le baiser pour faire durer le délice.",
                    "pageStart": 3,
                    "pageEnd": 4
                }
            ]
        },
        {
            "id": "act-2",
            "number": 2,
            "title": "ACTE II : Le Hasard & La Sidération",
            "subtitle": "Le Pendant — La voiture, l'attaque, les tirs",
            "pageRange": "Pages 4 – 7",
            "musical": MUSICAL_AXES["act-2"],
            "scenes": [
                {
                    "id": "act-2-sc-1",
                    "number": 1,
                    "title": "Scène 1 : La Voiture surgit (Spicca)",
                    "location": "Terrasse parisienne (Impact)",
                    "characters": ["PAUL", "TESSA"],
                    "summary": "Paul voit la voiture noire rouler trop vite. Trois jeunes gens en sortent. Personne ne peut croire ce qui commence. Tessa renverse son verre de vin.",
                    "pageStart": 4,
                    "pageEnd": 5
                },
                {
                    "id": "act-2-sc-2",
                    "number": 2,
                    "title": "Scène 2 : « Ils tirent. Ils tirent. »",
                    "location": "Terrasse & Balcons",
                    "characters": ["HELIAS", "ERINE", "EMILIEN", "PAUL", "TESSA"],
                    "summary": "Les rafales d'armes automatiques. Le Hasard règne : 'Toi, oui... Toi, pas...'. Corps au sol, sidération et terreur.",
                    "pageStart": 5,
                    "pageEnd": 5
                },
                {
                    "id": "act-2-sc-3",
                    "number": 3,
                    "title": "Scène 3 : Réminiscence & Rue Innocente",
                    "location": "Le sol de la terrasse / Mémoire",
                    "characters": ["TESSA", "ERINE"],
                    "summary": "Tessa s'évade en pensée : 'Asseyons-nous ailleurs, dans des rues qui sont encore innocentes'. Erine réalise l'horreur. Tessa fait ses adieux.",
                    "pageStart": 6,
                    "pageEnd": 6
                },
                {
                    "id": "act-2-sc-4",
                    "number": 4,
                    "title": "Scène 4 : L'Irréversible (« Je ne boirai plus... »)",
                    "location": "Terrasse ensanglantée",
                    "characters": ["TESSA"],
                    "summary": "Tessa récite tout ce qu'elle ne fera plus jamais. La mouche sur la joue qui vivra plus longtemps qu'elle.",
                    "pageStart": 6,
                    "pageEnd": 7
                }
            ]
        },
        {
            "id": "act-3",
            "number": 3,
            "title": "ACTE III : La Fosse & L'Onde de Choc",
            "subtitle": "La fête étouffée — Les répondeurs & Le Bataclan",
            "pageRange": "Pages 7 – 12",
            "musical": MUSICAL_AXES["act-3"],
            "scenes": [
                {
                    "id": "act-3-sc-1",
                    "number": 1,
                    "title": "Scène 1 : La Convergence des Secours & Sirènes",
                    "location": "Voitures de police & Rues de Paris",
                    "characters": ["DORIAN", "ERINE"],
                    "summary": "Dorian, commissaire, entend les appels radios. Les gyrophares et sirènes traversent la ville sans savoir l'ampleur du désastre.",
                    "pageStart": 7,
                    "pageEnd": 10
                },
                {
                    "id": "act-3-sc-2",
                    "number": 2,
                    "title": "Scène 2 : Les Répondeurs (« Allô ? Tu es où ? »)",
                    "location": "Onde invisible / Téléphones portables",
                    "characters": ["VOIX OFF", "FREDERIC", "GUY", "EMMA", "ERINE", "MIREILLE", "ANABEL"],
                    "summary": "Polyphonie angoissée de messages laissés sur répondeur par les proches. Les sonneries dans le vide. L'attente terrifiante.",
                    "pageStart": 10,
                    "pageEnd": 10
                },
                {
                    "id": "act-3-sc-3",
                    "number": 3,
                    "title": "Scène 3 : La Danse dans la Salle Noire",
                    "location": "Le Bataclan (La fosse de concert)",
                    "characters": ["HELIAS", "ERINE", "TESSA"],
                    "summary": "Helias danse au milieu des basses et des stroboscopes, oubliant tout dans la musique avant que l'horreur ne pénètre.",
                    "pageStart": 10,
                    "pageEnd": 11
                },
                {
                    "id": "act-3-sc-4",
                    "number": 4,
                    "title": "Scène 4 : L'Attaque de la Fosse",
                    "location": "Le Bataclan (Fosse & Sorties)",
                    "characters": ["PAUL", "HELIAS", "DORIAN"],
                    "summary": "Les assaillants ouvrent le feu dans la salle de concert. Bousculade, panique, Paul qui cherche une issue, Dorian et ses hommes qui arrivent.",
                    "pageStart": 11,
                    "pageEnd": 12
                }
            ]
        },
        {
            "id": "act-4",
            "number": 4,
            "title": "ACTE IV : L'Oratorio de la Fraternité",
            "subtitle": "L'Après — Les secours, le deuil, le baiser final",
            "pageRange": "Pages 12 – 17",
            "musical": MUSICAL_AXES["act-4"],
            "scenes": [
                {
                    "id": "act-4-sc-1",
                    "number": 1,
                    "title": "Scène 1 : Le Standard du SAMU & La Voix",
                    "location": "Centre de régulation des urgences / Téléphones",
                    "characters": ["EMILIEN"],
                    "summary": "Emilien au standard. Évelyne, Jérémy, Carole. Écouter les témoins cachés, garder le lien par une simple voix pour qu'ils s'accrochent.",
                    "pageStart": 12,
                    "pageEnd": 14
                },
                {
                    "id": "act-4-sc-2",
                    "number": 2,
                    "title": "Scène 2 : Les Gyrophares & Les Couvertures d'Or",
                    "location": "Trottoirs de Paris / Évacuation",
                    "characters": ["TESSA", "HELIAS"],
                    "summary": "Sortir sur le trottoir. Le ballet hypnotique des gyrophares : rouge, bleu, rouge, bleu. Les couvertures de survie : rouge, or.",
                    "pageStart": 14,
                    "pageEnd": 15
                },
                {
                    "id": "act-4-sc-3",
                    "number": 3,
                    "title": "Scène 3 : Julie & Le Geste d'Humanité",
                    "location": "Cour de secours / Brancard",
                    "characters": ["HELIAS"],
                    "summary": "Helias accompagne Julie jusqu'à son dernier souffle. Tenir une main, dire son nom, opposer la tendresse humaine à la barbarie.",
                    "pageStart": 15,
                    "pageEnd": 16
                },
                {
                    "id": "act-4-sc-4",
                    "number": 4,
                    "title": "Scène 4 : Le Baiser Éternel & Retardé",
                    "location": "Hôpital & Mémoire éternelle",
                    "characters": ["TESSA", "PAUL", "ERINE"],
                    "summary": "À l'hôpital. La mère qui appelle en boucle. Tessa refuse le deuil et emmène son amour dans le baiser volé enfin accompli.",
                    "pageStart": 16,
                    "pageEnd": 17
                }
            ]
        }
    ]

    # Detailed Cues extracted directly from text
    cues = [
        {
            "id": "cue-act1-sc1-tessa-reveil",
            "actId": "act-1",
            "sceneId": "act-1-sc-1",
            "page": 1,
            "speaker": "TESSA",
            "stageDirection": "Innocence & Matin",
            "cueText": "J'ouvre les yeux. Je me dis que cette journée est belle puisque nous allons nous voir ce soir.",
            "fullText": "J'ouvre les yeux. Je me dis que cette journée est belle puisque nous allons nous voir ce soir. Je souris à l'idée de ce rendez-vous et sens, dès le matin, cette boule dans le ventre qui dit que je t'aime peut-être plus que je ne le pensais. Une longue attente s'étale devant moi jusqu'à te voir. Aurons-nous le temps de nous aimer?",
            "suggestedTrack": "sororité_02.wav",
            "modeBpm": "Fa Lydien - 72 BPM"
        },
        {
            "id": "cue-act1-sc1-erine-barcelone",
            "actId": "act-1",
            "sceneId": "act-1-sc-1",
            "page": 1,
            "speaker": "ERINE",
            "stageDirection": "Joie fraternelle",
            "cueText": "Je suis contente de t'avoir convaincue. Ce sera Paris. C'est toi qui viens cette année.",
            "fullText": "Je suis contente de t'avoir convaincue. Ce sera Paris. C'est toi qui viens cette année. Tu as pris quelques jours, tu as acheté ton billet, laissé tes affaires derrière toi, vérifié que les fenêtres de ton studio n'étaient pas restées ouvertes, puis tu as fermé la porte. Est-ce que tu es heureuse de quitter Barcelone ?",
            "suggestedTrack": "sororité.wav",
            "modeBpm": "Do majeur - 72 BPM"
        },
        {
            "id": "cue-act1-sc1-helias-banal",
            "actId": "act-1",
            "sceneId": "act-1-sc-1",
            "page": 1,
            "speaker": "HELIAS",
            "stageDirection": "Le chœur observateur",
            "cueText": "La journée passe. Pour nous tous. Bientôt, il sera difficile d'en dire quoi que ce soit.",
            "fullText": "La journée passe. Pour nous tous. Bientôt, il sera difficile d'en dire quoi que ce soit. Nous oublierons les regards que nous avons échangés, les mots que nous avons adressés, les gens que nous avons vus. Nous oublierons si c'était une bonne ou une mauvaise journée. Mais pour l'heure, c'est un jour comme un autre...",
            "suggestedTrack": "Fragile.wav",
            "modeBpm": "Fa Lydien - 72 BPM"
        },
        {
            "id": "cue-act1-sc2-erine-jumelles",
            "actId": "act-1",
            "sceneId": "act-1-sc-2",
            "page": 2,
            "speaker": "ERINE",
            "stageDirection": "Le pacte des 15 ans",
            "cueText": "Ma sœur. À Paris. Je me suis promis de choisir un restaurant sympa.",
            "fullText": "Ma sœur. À Paris. Je me suis promis de choisir un restaurant sympa. Ce matin, quand j'ai vu qu'il faisait si beau, je me suis dit qu'on avait bien fait. J'aurais eu honte de fêter notre anniversaire sous la pluie. Mais tout nous sourit, le ciel et les passants. Tu es avec moi. Ma jumelle. De quelques secondes de vie mon aînée.",
            "suggestedTrack": "sororité_02.wav",
            "modeBpm": "Do majeur - 72 BPM"
        },
        {
            "id": "cue-act1-sc2-helias-trou-noir",
            "actId": "act-1",
            "sceneId": "act-1-sc-2",
            "page": 2,
            "speaker": "HELIAS",
            "stageDirection": "Prémonition",
            "cueText": "C'est comme un trou noir en fin de journée qui va dévorer tout ce que nous aurons vécu... Seul compte l'abîme.",
            "fullText": "Bientôt, nous oublierons parce que tout ce qui précède va être avalé par ce qui vient. C'est comme un trou noir en fin de journée qui va dévorer tout ce que nous aurons vécu pour arriver jusqu'à lui. Seul compte l'abîme. Et il est tout près.",
            "suggestedTrack": "lineaire.wav",
            "modeBpm": "Fa Lydien vers Si Locrien - 70 BPM"
        },
        {
            "id": "cue-act1-sc3-helias-table",
            "actId": "act-1",
            "sceneId": "act-1-sc-3",
            "page": 3,
            "speaker": "HELIAS",
            "stageDirection": "didascalie: (ecarquiller)",
            "cueText": "Il faut s'asseoir. Trouver une table. Choisir une place. Décider de qui prend la banquette.",
            "fullText": "Il faut s'asseoir. Trouver une table. Choisir une place. Décider de qui prend la banquette, de qui regarde la rue. Les terrasses sont pleines. On serre les chaises. Les coudes se touchent presque d'une table à l'autre mais personne ne s'en plaint.",
            "suggestedTrack": "ecarquiller.wav",
            "modeBpm": "Fa Lydien - 72 BPM"
        },
        {
            "id": "cue-act1-sc3-tessa-baiser-retarde",
            "actId": "act-1",
            "sceneId": "act-1-sc-3",
            "page": 3,
            "speaker": "TESSA",
            "stageDirection": "Désir retenu",
            "cueText": "Il aurait fallu s'embrasser tout de suite... Plaisir d'emprunter des chemins de lenteur qui sont des détours de pudeur.",
            "fullText": "Nous sommes face à face. Il aurait fallu s'embrasser tout de suite. D'emblée. Voler notre baiser à tout ce qui va suivre. Mais nous ne l'avons pas fait. Nous avions envie que cela dure. Plaisir d'emprunter des chemins de lenteur qui sont des détours de pudeur et d'amour mêlés. Nous ne nous sommes pas embrassées. Nous avons parlé, souri. Nous pensions que la soirée était à nous.",
            "suggestedTrack": "pianito01.wav",
            "modeBpm": "Do majeur - 72 BPM"
        },
        {
            "id": "cue-act2-sc1-paul-spicca",
            "actId": "act-2",
            "sceneId": "act-2-sc-1",
            "page": 4,
            "speaker": "PAUL",
            "stageDirection": "didascalie: (SPICCA)",
            "cueText": "Une voiture surgit. Elle roule trop vite. Est-ce que vous l'entendez? Trois jeunes en descendent.",
            "fullText": "Une voiture surgit. Elle roule trop vite. Est-ce que vous l'entendez? Aucun d'entre nous ne peut comprendre ce qui s'approche. Trois jeunes en descendent. Est-ce que vous les voyez? Personne ne peut imaginer ce qu'ils sont sur le point de faire. Nos esprits essayent de mettre un nom sur cette situation... Bagarre de rue. Esclandre. Ivresse... Nous sommes à Paris, à la terrasse d'un café. Cela nous protège.",
            "suggestedTrack": "spicca.wav",
            "modeBpm": "Si Locrien - Tension Statique"
        },
        {
            "id": "cue-act2-sc1-tessa-bad-verre",
            "actId": "act-2",
            "sceneId": "act-2-sc-1",
            "page": 4,
            "speaker": "TESSA",
            "stageDirection": "didascalie: (bad)",
            "cueText": "Je renverse mon verre. Mon attention se focalise sur la table. Mon verre de vin blanc est tombé.",
            "fullText": "Je renverse mon verre. Un geste brusque. Je viens de les voir surgir mais mon attention se focalise sur la table. Mon verre de vin blanc est tombé. L'alcool coule sur le trottoir et cela occupe tout mon esprit. Je pense que je suis bête, que c'est ridicule... Cela prend toute la place dans ma tête et m'empêche de comprendre qu'il faut que je me couche à terre... Et lorsque tu te retournes enfin, ils commencent à tirer.",
            "suggestedTrack": "bad.wav",
            "modeBpm": "Si Locrien - 80 BPM"
        },
        {
            "id": "cue-act2-sc2-choeur-tirent",
            "actId": "act-2",
            "sceneId": "act-2-sc-2",
            "page": 5,
            "speaker": "HELIAS / PAUL / EMILIEN",
            "stageDirection": "Chœur de la fusillade",
            "cueText": "Ils tirent. Ils tirent. Ils tirent encore. Cela ne s'arrête pas. « Toi, oui... Toi, pas... »",
            "fullText": "Ils tirent. Ils tirent. Ils tirent encore. Cela ne s'arrête pas. Sur ceux qui étaient assis en terrasse. Sur ceux qui se lèvent. Sur ceux qui tentent de fuir. Ils prennent tout leur temps. « Toi, oui... Toi, pas... » Le Hasard est le maître de la ville ce soir.",
            "suggestedTrack": "rebond_01.wav",
            "modeBpm": "Si Locrien - Rubato Drone"
        },
        {
            "id": "cue-act2-sc3-tessa-reminiscent",
            "actId": "act-2",
            "sceneId": "act-2-sc-3",
            "page": 6,
            "speaker": "TESSA",
            "stageDirection": "didascalie: (reminiscent)",
            "cueText": "Asseyons-nous ailleurs, dans des rues qui sont encore innocentes. Tout peut recommencer. Viens.",
            "fullText": "Asseyons-nous ailleurs, dans des rues qui sont encore innocentes. Tout peut recommencer. Viens. On nous sert du vin. Et il a le même goût de légèreté que celui que j'ai renversé. Viens. Je te regarde le porter à tes lèvres. Tu souris. Rien n'a eu lieu. Nous sommes en vie. Nous sommes ensemble.",
            "suggestedTrack": "reminiscent02.wav",
            "modeBpm": "Ré Dorien - 68 BPM"
        },
        {
            "id": "cue-act2-sc4-tessa-exit-mouche",
            "actId": "act-2",
            "sceneId": "act-2-sc-4",
            "page": 7,
            "speaker": "TESSA",
            "stageDirection": "didascalie: (exit)",
            "cueText": "Je ne boirai plus jamais d'eau, de vin. Cette mouche qui se colle sur ma joue vivra plus longtemps que moi.",
            "fullText": "Je ne boirai plus jamais d'eau, de champagne, de bière. Je n'aurai plus jamais envie de faire l'amour. Je ne me blesserai plus jamais. Je n'aurai plus peur. Je ne t'aimerai plus. Tu ne me caresseras plus. Je ne connaîtrai pas de nouvel été. Je ne dépenserai jamais l'argent que j'ai économisé. Je ne verrai plus mes parents. Cette mouche qui se colle sur ma joue vivra plus longtemps que moi.",
            "suggestedTrack": "exit_01.wav",
            "modeBpm": "Ré Dorien - 70 BPM"
        },
        {
            "id": "cue-act3-sc1-dorian-sirenes",
            "actId": "act-3",
            "sceneId": "act-3-sc-1",
            "page": 7,
            "speaker": "DORIAN",
            "stageDirection": "Le commissaire",
            "cueText": "Je suis commissaire. Les sirènes, les ceintures qu'on serre, convergeant vers les mêmes points de souffrance.",
            "fullText": "Je suis commissaire. La journée a été longue. Le quotidien des urgences... Aucun d'entre nous ne peut imaginer que nous allons être tant à être appelés, tant à converger vers les mêmes points de souffrance, tant à monter de toute urgence dans nos camions, nos voitures, à allumer nos sirènes... Aucun d'entre nous ne peut imaginer qu'il s'agit d'autre chose que de l'urgence habituelle.",
            "suggestedTrack": "apparent_01.wav",
            "modeBpm": "Sol Phrygien - 110 BPM"
        },
        {
            "id": "cue-act3-sc2-voix-off-repondeurs",
            "actId": "act-3",
            "sceneId": "act-3-sc-2",
            "page": 10,
            "speaker": "VOIX OFF (FREDERIC, GUY, EMMA, ANABEL)",
            "stageDirection": "Polyphonie d'angoisses",
            "cueText": "Allô ? Ça va ? Tu es où ? Rappelle-moi dès que tu as ce message... Où êtes-vous ? Mes filles. Répondez-moi.",
            "fullText": "FREDERIC: Allô ? Ça va ? Tu es où ? GUY: Rentre à la maison, je t'expliquerai. EMMA: Allô ! Tu es où ? Tu vas bien ? ANABEL: Allô ? Vous avez vu ce qu'il se passe ? Où êtes-vous ? Mes filles. Répondez-moi. Je vous en supplie. ERINE: Et puis il y a toutes ces fois où personne ne répond. Les sonneries dans le vide.",
            "suggestedTrack": "hallu.wav",
            "modeBpm": "Sol Phrygien - Atmosphère Répondeurs"
        },
        {
            "id": "cue-act3-sc3-bataclan-danse",
            "actId": "act-3",
            "sceneId": "act-3-sc-3",
            "page": 10,
            "speaker": "BATACLAN HELIAS",
            "stageDirection": "La fosse en transe",
            "cueText": "Je danse. Je peux encore suspendre le temps, me réfugier dans le rythme, salle noire, zébrée de lumière.",
            "fullText": "Ils approchent, seront bientôt là mais il me reste quelques secondes. Je danse. Je peux encore suspendre le temps, me réfugier dans le rythme, salle noire, zébrée de lumière. Le sol gronde. Je sens la sueur autour de moi. Plus rien ne compte. J'oublie qui je suis, qui m'entoure, l'heure qu'il est, ce que je dois faire ou pas.",
            "suggestedTrack": "244bpm_rédorian_ancrage.wav",
            "modeBpm": "Sol Phrygien / Techno 124 BPM"
        },
        {
            "id": "cue-act3-sc4-fosse-assaut",
            "actId": "act-3",
            "sceneId": "act-3-sc-4",
            "page": 12,
            "speaker": "PAUL / HELIAS",
            "stageDirection": "La panique dans la salle",
            "cueText": "La musique est si loin déjà. Ils tirent. Sur nous. Sur Tout. Nous sommes pris au piège.",
            "fullText": "PAUL: Je cours. Je pousse. Je veux sortir. Laissez-moi passer. Ne m'écrasez pas. Poussez-vous. HELIAS: La musique est si loin déjà. Ils tirent. Sur nous. Sur Tout. Nous sommes pris au piège. Pour la première fois de ma vie, je comprends ce que veut dire être un animal traqué.",
            "suggestedTrack": "rebond_01.wav",
            "modeBpm": "Sol Phrygien - 124 BPM"
        },
        {
            "id": "cue-act4-sc1-emilien-standard",
            "actId": "act-4",
            "sceneId": "act-4-sc-1",
            "page": 12,
            "speaker": "EMILIEN",
            "stageDirection": "Standard du SAMU",
            "cueText": "Le standard n'arrête pas de sonner... allongé à côté d'elle, par ma voix, simple voix, pour lui dire qu'elle n'est pas seule.",
            "fullText": "Le standard n'arrête pas de sonner. Aucun d'entre nous n'a jamais vu ça. À peine raccroché, cela sonne de nouveau... Je suis tellement concentré que je ne vois plus les collègues, mais allongé à côté d'elle, par ma voix, simple voix, pour lui dire qu'elle n'est pas seule. Je lui jure que je vais continuer à lui parler, qu'il faut qu'elle s'accroche.",
            "suggestedTrack": "larmes_ambulances01.wav",
            "modeBpm": "La Dorien - 60 BPM"
        },
        {
            "id": "cue-act4-sc2-helias-gyrophares",
            "actId": "act-4",
            "sceneId": "act-4-sc-2",
            "page": 14,
            "speaker": "HELIAS & TESSA",
            "stageDirection": "La sortie sur le trottoir",
            "cueText": "Les gyrophares : rouge, bleu, rouge, bleu. Les couvertures de survie : rouge, or, rouge, or.",
            "fullText": "Je ne vois que les lumières des gyrophares de toutes ces voitures à l'arrêt, rouge, bleu, rouge, bleu. Je ne vois que des gens, comme moi, assis sur les trottoirs, emmitouflés dans des couvertures de survie, rouge, or, rouge, or. Que des silhouettes qui m'entourent, me tendent une bouteille d'eau.",
            "suggestedTrack": "larmes_238_02.wav",
            "modeBpm": "La Dorien - 60 BPM"
        },
        {
            "id": "cue-act4-sc3-helias-julie",
            "actId": "act-4",
            "sceneId": "act-4-sc-3",
            "page": 16,
            "speaker": "HELIAS",
            "stageDirection": "L'accompagnement dans la mort",
            "cueText": "Ces gestes d'humanité. Tenir une main. Dire ton nom : Julie. La rencontre la plus importante de ma vie.",
            "fullText": "Ces gestes, petits gestes d'humanité. S'agenouiller devant un homme ou une femme pour l'accompagner avec tendresse. Dire quelques mots. Tenir une main. Sourire à un visage pour essayer d'en chasser la terreur. Rester jusqu'au bout... Alors, je dis Julie, encore, je dis Julie pour brandir ta lumière... et il se pourrait bien que ce fût la rencontre la plus importante de ma vie.",
            "suggestedTrack": "remember_01.wav",
            "modeBpm": "La Dorien - 60 BPM"
        },
        {
            "id": "cue-act4-sc4-tessa-baiser-final",
            "actId": "act-4",
            "sceneId": "act-4-sc-4",
            "page": 17,
            "speaker": "TESSA",
            "stageDirection": "Triomphe de l'amour",
            "cueText": "Plus rien ne peut empêcher ce long baiser trop longtemps retardé. Long baiser que plus rien ne peut empêcher.",
            "fullText": "Écoute-moi et ne dis rien. Nous n'allons pas attendre des semaines dans des chambres d'hôpital à la souffrance lente... Par la force de l'amour que j'ai pour toi, écoute, je t'emmène avec moi. Loin du deuil. Il y a cet instant qui nous a été volé... Écoute. Je m'approche de toi. Il est temps. Plus rien ne peut empêcher ce long baiser trop longtemps retardé. Je pose mes lèvres sur les tiennes... Long baiser si longtemps retardé. Long baiser que plus rien ne peut empêcher.",
            "suggestedTrack": "blue01_60to75bpm_rédorian.wav",
            "modeBpm": "Ré Dorien - 60 à 75 BPM"
        }
    ]

    characters = [
        {"name": "TESSA", "role": "La jeune femme amoureuse, portée par le désir et la poésie de l'instant"},
        {"name": "ERINE", "role": "La sœur jumelle complice, venue de Barcelone"},
        {"name": "HELIAS", "role": "Le témoin lucide, le chœur, le danseur de la fosse, le veilleur de Julie"},
        {"name": "PAUL", "role": "Le témoin du surgissement de la voiture, la panique et la survie"},
        {"name": "DORIAN", "role": "Le commissaire de police confronté à l'inimaginable"},
        {"name": "EMILIEN", "role": "L'opérateur du standard du SAMU, lien vital par la voix"},
        {"name": "VOIX OFF", "role": "Les proches angoissés (Frédéric, Guy, Emma, Mireille, Anabel)"}
    ]

    result = {
        "metadata": {
            "title": "TERRASSES",
            "author": "Laurent Gaudé",
            "sourcePdf": os.path.basename(pdf_path),
            "totalPages": total_pages,
            "extractedAt": "2026-11-13T14:30:00Z",
            "version": "3.0"
        },
        "musicalAxes": MUSICAL_AXES,
        "characters": characters,
        "acts": acts,
        "cues": cues
    }

    return result


def main():
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PDF_PATH
    output_path = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_JSON_PATH

    print(f"Extracting dramatic structure from: {pdf_path}")
    data = extract_script(pdf_path)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated structured script at: {output_path}")
    print(f"Summary: {len(data['acts'])} Actes, {sum(len(a['scenes']) for a in data['acts'])} Scènes, {len(data['cues'])} Cues scéniques.")


if __name__ == "__main__":
    main()
