---
title: "Mit Integromat Trello-Notion-Verbindung herstellen"
date: 2021-10-29T15:27:04
autor: "Andrea Kaden"
themen: ["artikel","coole-tools","produktivitaet-und-zeitmanagement","software","tippsundtricks"]
bild: "/wp-content/uploads/Thumnail6-600x330.png"
auszug: "Transkript zum Video: Ich hab‘ euch was Leckeres gebaut. Und zwar eine einfache Möglichkeit, wie alle Trello Karten, auf denen ihr verlinkt werdet, völlig automatisiert über Integromat in euer System in Notion übertragen werden …"
permalink: "/mit-integromat-trello-notion-verbindung-herstellen/"
wp_id: 11509
---
<iframe src="https://www.youtube-nocookie.com/embed/QLw7QTTEHJc" title="YouTube video player" loading="lazy" allowfullscreen=""></iframe>

  
**Transkript zum Video**: Ich hab‘ euch was Leckeres gebaut. Und zwar eine einfache Möglichkeit, wie alle [Trello](https://trello.com/de/home) Karten, auf denen ihr verlinkt werdet, völlig automatisiert über [Integromat](https://www.make.com/en) in euer System in [Notion](https://en.wikipedia.org/wiki/Notion_\(productivity_software\)) übertragen werden. Und wie das funktioniert, das zeige ich euch jetzt step-by-step. Ich bin Jan Lambers und ihr seid bei zeitgewinn hamburg.

## Überblick

Ja, das Ganze funktioniert folgendermaßen. Ich bin hier in Integromat und ich habe hier ein Modul gebaut, welches alle 15 Minuten jedes Trello-Board abtastet, in dem ich mich befinde.

Und wenn es bemerkt, dass irgendein User zu irgendeiner Karte hinzugefügt wurde checked der das und schickt das Ganze auf die Reise Richtung Notion. Hier in der Mitte aber befindet sich ein Filter, der lässt nur die Karten durch auf denen Jan Lambers (in meinem Fall jetzt Jan Lambers) hinzugefügt wurde und lässt sie dann weiter Richtung Notion. Alle anderen, auf denen irgendein Kollege verlinkt wurde, schmeißt er dann weg. Und das Ganze wird dann am Ende in eine vorher definierte Notion-Datenbank reingepackt.

Und ich mache da jetzt einfach mal einen Test. Füge hier zu dem Test Board 1 einfach mal irgendeine Karte hinzu. Auf der verlinke ich mich jetzt mal nicht. Die sollte nicht auf die Reise Richtung Notion geschickt werden, also im Notion-Board nicht auftauchen. Und hier füge ich noch eine Karte hinzu. Und da werde ich mich gleich hinzufügen. Ich füge mich jetzt hier als Member hinzu. Und lass das Ganze jetzt hier mal laufen. So „Run Once“. Jetzt sollte das gleich auftauchen.

Und da ist es auch schon. Hier ist der Name der Trello-Karte. Hier ist das Trello Board, das Test Board 2 und hier der Link, mit dem ich direkt wieder zur Karte komme. Geile Sache. Jetzt bauen wir den Bums.

## Verbindung bauen

So als erstes geht ihr in Notion, packt euch eine Datenbank irgendwohin. Benennt die. Dann soll das hier eurer Name werden? Dann soll es einen Link geben. Das soll dann natürlich auch hier eine URL sein.

Und als drittes den Namen des Trello-Boards. Zack! Dann löscht ihr hier die leeren Spalten raus.

Als zweites geht ihr in Integromat, klickt auf create a new Szenario. Klickt hier auf das große Plus. Sucht nach Trello. Und wählt Trello aus. Jetzt wählt ihr hier ganz oder fast ganz unten den Trigger Watch Activities ACID.

### Verbindung zwischen Integromat und Trello

Und jetzt braucht ihr natürlich noch eine Connection zwischen Integromat und Trello. Deswegen geht ihr hier auf add und hier auf continue. Und wenn ihr jetzt noch nicht eingeloggt seid in Trello, müsst ihr das noch tun. Ich bin das jetzt schon und muss jetzt nur noch auf akzeptieren bzw. allow klicken. Und damit steht die Verbindung. Jetzt gehe ich hier auf Watch All Objects und wähle aus, dass jedes Objekt in meinem Trello beobachtet werden soll. Und als Action wähle ich aus Add Member to Card. Als Limit gebe ich jetzt noch mal 100 ein und drück auf ok. Als nächstes geht ihr in Integromat, klickt neben das Modul und drückt auf Add another Module.

### Verbindung zwischen Integromat und Notion

Jetzt sucht ihr hier nach Notion. Bei mir taucht das jetzt schon auf. Komischerweise. Drückt hier drauf und geht auf Create a Database Item. Jetzt müsst ihr wie bei Trello gerade auch hier noch die Connection herstellen. Klickt hier auf add und auf continue und müsst jetzt die Seite auswählen oder die Datenbank auswählen, mit der ihr das ganze verknüpfen wollt. Die haben wir ja vorhin schon erstellt und die heißt Trello Karten. Und taucht dann hier auf. Also einfach suchen könnt euch da auch sonst durchklicken. Und jetzt geht er auf Allow Access. Die Connection ist also jetzt auch da. Und taucht auch jetzt auf, Trello Karten, einmal auswählen. Und jetzt tauchen hier die drei Spalten, hier Trello Karte, Trello Link und Trello Board.

### Trello-Daten den Notion-Spalten zuweisen

Tauchen jetzt hier auf und als nächstes weist ihr jetzt den Daten aus Trello die richtigen Spalten in Notion zu. Ihr geht also erst einmal auf Trello Karte. Klickt hier auf Card und hier auf den Namen der Karte. Als nächstes geht es um den Trello Link. Hier einen kleinen Trick: Ihr macht hier ein Anführungszeichen, wählt dann ein, händisch, „https//trello.com/c/SHORTLINK“.

Und jetzt schaut ihr hier rein und geht auf wieder auf Card und auf Shortlink und zu guter Letzt macht ihr noch mal Anführungszeichen. So. Und das Trello Board am Ende… Board und auf den Namen des Boards.

### Filter setzen

Und als vorletztes geht es noch um den Filter. Ihr klickt einfach hier auf Filter. Ich zieh mir das nochmal ein Stück auseinander. Hier auf. Den Maulschlüssel klicken und auf Set up a Filter gehen, den irgendwie benennen, weil bis jetzt ist es ja so, dass er.

Also dass Integromat alle Karten, auf den irgendwer hinzugefügt wurde, mir in Notion schieben würde und das will ich ja nicht. Ich will ja nur mich haben und deswegen kann man hier oben suchen nach Member. Und. Hier müsste jetzt genau da Full Name drauf gehen, dann Equal to auswählen hier und jetzt gebt ihr euern Namen ein, so wie ihr in Trello heißt. Ich packe jetzt mal meinen Namen rein und auf OK.

### Test

Und jetzt testen wir das Ganze noch mal. Ich mache auf dem einen Board eine Karte, wo ich mich drauf verlinke. Nenn ich jetzt mal Karte XY, die sollte übertragen werden. Füge mich dort hinzu. Ja und ich mache im selben Board noch mal eine Karte ohne mich, wo ich mich nicht hinzufüge und jetzt gehe ich hier noch einmal auf run once als letzten Test quasi und hoffe, dass das jetzt übertragen wird. Ja, Karte XY mit dem Trello Link und im Test Board. Und wenn ich hier draufklicke, öffnet er mir die Karte. Sehr gut. Das hat doch schön geklappt.

### Szenario aktivieren

Das letzte, was ihr jetzt noch machen müsst, ihr geht nochmal in Integromat, ich schien mich noch weiter nach oben und geht hier auf On. Einfach anmachen das Ding. Das ist, wenn ihr die Bezahl-Version habt, kann er das die ganze Zeit machen, wenn ihr die nicht habt, dann checkt der Trello alle 15 Minuten. Das heißt, sobald es jetzt an ist und ihr macht noch einen Test nicht wundern. Das dauert dann 15 Minuten bis das ganze übertragen wird. Ist in der Praxis aber nicht wild.

Einfach nur noch hier auf activate. Fertig. Ich hoffe dir hat das Video gefallen. Wenn du Fragen, Wünsche, Anregungen hast, oder auch einfach nur einen Gruß dalassen möchtest, mach das gerne in den Kommentaren oder füge mich bei LinkedIn hinzu oder schau doch mal bei [www.zeitgewinn-hamburg.de](/) vorbei. Ich verlinke dir alles in der Video Beschreibung. Peace!
