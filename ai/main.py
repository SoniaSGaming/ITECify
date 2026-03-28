from groq import Groq
client = Groq(api_key="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")

def get_suggestion(codul_scris):
    prompt = f"""Esti un asistent de programare expert in TOATE limbajele de programare.
        Analizeaza codul de mai jos si detecteaza automat in ce limbaj e scris.
        Apoi sugereaza cum sa fie continuat, folosind ACELASI limbaj detectat.
        Codul scris pana acum: {codul_scris}
        Reguli:
            - Detecteaza limbajul (Python, JavaScript, C++, HTML, PHP)
            - Sugestia trebuie sa fie in ACELASI limbaj
            - Maxim 10 linii de cod
            - O singura sugestie concreta
        Formatul răspunsului:
        Limbaj: <limbajul detectat>
        EXPLICATIE: <de ce e utilă sugestia>
        COD: <codul sugerat>"""
    raspuns = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400
    )
    text = raspuns.choices[0].message.content.strip()
    limbaj, explicatie, cod = "", "", ""
    if "Limbaj:" in text:
        limbaj = text.split("Limbaj:")[1].split("EXPLICATIE:")[0].strip()
    if "EXPLICATIE:" in text and "COD:" in text:
        explicatie = text.split("EXPLICATIE:")[1].split("COD:")[0].strip()
        cod = text.split("COD:")[1].strip()
    return {"limbaj": limbaj, "explicatie": explicatie, "cod": cod}

def ruleaza_asistentul():
    print("=" * 50)
    print("         Clanker ")
    print("=" * 50)
    print("Lipește codul tău și apasă ENTER de 2 ori când termini:\n")

    linii_cod = []
    linii_goale_consecutive = 0 

    while True:
        linie = input()

        if linie == "":
            linii_goale_consecutive += 1
            if linii_goale_consecutive >= 2:
                break
        else:
            linii_goale_consecutive = 0
            linii_cod.append(linie)

    codul_complet = "\n".join(linii_cod)
    print("\n Generez sugestie...\n")

    try:
        rezultat = get_suggestion(codul_complet)

        print("─" * 50)
        print(" Sugestia lui Clanker:")
        print("─" * 50)
        print(" Limbaj detectat:", rezultat["limbaj"])
        print("\n Explicatie:", rezultat["explicatie"])
        print("\n Cod sugerat:")
        print(rezultat["cod"])
        print("─" * 50)

        while True:
            decizie = input("\nAccepți sugestia? (a = accept / r = reject): ").lower()
            if decizie == "a":
                print("\n✅ Sugestie acceptată! Codul sugerat:")
                print(rezultat["cod"])
                break
            elif decizie == "r":
                print("\n❌ Sugestie respinsă. Continuă să codezi!")
                break
            else:
                print("Scrie 'a' pentru accept sau 'r' pentru reject.")

    except Exception as e:
        print(f"❌ Eroare: {e}")

if __name__ == "__main__":
    ruleaza_asistentul()