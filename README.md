# Bachelors Fake Review Detection

1. **Experiment**  
   Eksperimentai su tradiciniais klasifikavimo algoritmais (SVM, K-NN, LR) ir iš anksto apmokytu RoBERTa modeliu.

2. **Extension**  
   Įskiepis kuris ‚Amazon‘ ir ‚Yelp‘ platformose kiekvieną atsiliepimą pažymi kaip **Tikras** arba **Netikras** ir leidžia paslėpti netikras atsiliepimus.

---

## Naudojimas 
1. Sukurti virtualią python aplinką ir įrašyti prediction.py naudojamas bibliotekas.
2. Paleisti prediction.py serverį su komanda python prediction.py.
3. Atsidaryti Chrome naršyklę ir į paieškos juostą įrašyti chrome://extensions.
4. Įjungti Developer Mode rėžimą (Viršuje dešinėje)
5. Spustėlti ant Load Unpacked
6. Pasirinkti Extension folderį
7. Nueiti į Amazon/Yelp svetainę, pasirinkti betkokį servisą ar produktą ir pažiūrėti ar prie atsiliepimų pridėta etiketė. 

