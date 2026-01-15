import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { VectorEntry, DriveItem } from "../types";
import { createEmbedding } from "./db_services";
import * as dotenv from "dotenv";
dotenv.config();

export async function embedDriveItem(document: DriveItem) {
  const doc = new Document({
    pageContent: document.content ?? "",
    metadata: {
      source_name: document.name,
      source_id: document.id,
      mimeType: document.mimeType,
    },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const chunks = await splitter.splitDocuments([doc]);

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.pageContent)
  );

  console.log(vectors);

  const entries: VectorEntry[] = chunks.map((chunk, i) => ({
    content: chunk.pageContent,
    source_name: chunk.metadata.source_name,
    source_id: chunk.metadata.source_id,
    chunk_index: i,
    mimeType: chunk.metadata.mimeType,
    embedding: vectors[i],
    created_at: new Date(),
  }));

  entries.forEach((element) => {
    createEmbedding(element);
  });

  return entries;
}

const googleDocExample: DriveItem = {
  id: "1a2b3c4d5e6f7g8h9i0j",
  name: "neuromancer",
  mimeType: "application/vnd.google-apps.document",
  content: `The sky above the port was the color of television, tuned
to a dead channel.
  'It's not like I'm using,' Case heard someone say, as he
shouldered his way through the crowd around the door of the
Chat.  'It's like my body's developed this massive drug defi-
ciency.'  It was a Sprawl voice and a Sprawl joke.  The Chatsubo
was a bar for professional expatriates; you could drink there
for a week and never hear two words in Japanese.
  Ratz was tending bar, his prosthetic arm jerking monoto-
nously as he filled a tray of glasses with draft Kirin.  He saw
Case and smiled, his teeth a webwork of East European steel
and brown decay.  Case found a place at the bar, between the
unlikely tan on one of Lonny Zone's whores and the crisp naval
uniform of a tall African whose cheekbones were ridged with
precise rows of tribal scars.  'Wage was in here early, with two
joeboys,' Ratz said, shoving a draft across the bar with his
good hand.  'Maybe some business with you, Case?'
  Case shrugged.  The girl to his right giggled and nudged
him.
  The bartender's smile widened.  His ugliness was the stuff
of legend.  In an age of affordable beauty, there was something
heraldic about his lack of it.  The antique arm whined as he
reached for another mug.  It was a Russian military prosthesis,
a seven-function force-feedback manipulator, cased in grubby
pink plastic.  'You are too much the artiste, Herr Case.'  Ratz
grunted; the sound served him as laughter.  He scratched his
overhang of white-shirted belly with the pink claw.  'You are
the artiste of the slightly funny deal.'
  'Sure,' Case said, and sipped his beer.  'Somebody's gotta
be funny around here.  Sure the fuck isn't you.'
  The whore's giggle went up an octave.
  'Isn't you either, sister.  So you vanish, okay?  Zone, he's
a close personal friend of mine.'
  She looked Case in the eye and made the softest possible
spitting sound, her lips barely moving.  But she left.
  'Jesus,' Case said, 'what kinda creepjoint you running here? 
Man can't have a drink.'
  'Ha,' Ratz said, swabbing the scarred wood with a rag,
'Zone shows a percentage.  You I let work here for entertain-
ment value.'
  As Case was picking up his beer, one of those strange
instants of silence descended, as though a hundred unrelated
conversations had simultaneously arrived at the same pause. 
Then the whore's giggle rang out, tinged with a certain hysteria.
  Ratz grunted.  'An angel passed.'
  'The Chinese,' bellowed a drunken Australian, 'Chinese
bloody invented nerve-splicing.  Give me the mainland for a
nerve job any day.  Fix you right, mate...'
  'Now that,' Case said to his glass, all his bitterness suddenly
rising in him like bile, 'that is _so_ much bullshit.'

  The Japanese had already forgotten more neurosurgery than
the Chinese had ever known.  The black clinics of Chiba were
the cutting edge, whole bodies of technique supplanted monthly,
and still they couldn't repair the damage he'd suffered in that
Memphis hotel.
  A year here and he still dreamed of cyberspace, hope fading
nightly.  All the speed he took, all the turns he'd taken and the
corners he'd cut in Night City, and still he'd see the matrix in
his sleep, bright lattices of logic unfolding across that colorless
void...  The Sprawl was a long strange way home over the
Pacific now, and he was no console man, no cyberspace cow-
boy.  Just another hustler, trying to make it through.  But the
dreams came on in the Japanese night like livewire voodoo,
and he'd cry for it, cry in his sleep, and wake alone in the
dark, curled in his capsule in some coffin hotel, his hands
clawed into the bedslab, temperfoam bunched between his fin-
gers, trying to reach the console that wasn't there.

  'I saw your girl last night,' Ratz said, passing Case his
second Kirin.
  'I don't have one,' he said, and drank.
  'Miss Linda Lee.'
  Case shook his head.
  'No girl?  Nothing?  Only biz, friend artiste?  Dedication to
commerce?'  The bartender's small brown eyes were nested
deep in wrinkled flesh.  'I think I liked you better, with her. 
You laughed more.  Now, some night, you get maybe too ar-
tistic; you wind up in the clinic tanks, spare parts.'
  'You're breaking my heart, Ratz.'  He finished his beer,
paid and left, high narrow shoulders hunched beneath the rain-
stained khaki nylon of his windbreaker.  Threading his way
through the Ninsei crowds, he could smell his own stale sweat.

  Case was twenty-four.  At twenty-two, he'd been a cowboy,
a rustler, one of the best in the Sprawl.  He'd been trained by
the best, by McCoy Pauley and Bobby Quine, legends in the
biz.  He'd operated on an almost permanent adrenaline high, a
byproduct of youth and proficiency, jacked into a custom cy-
berspace deck that projected his disembodied consciousness
into the consensual hallucination that was the matrix.  A thief,
he'd worked for other, wealthier thieves, employers who pro-
vided the exotic software required to penetrate the bright walls
of corporate systems, opening windows into rich fields of data.
  He'd made the classic mistake, the one he'd sworn he'd
never make.  He stole from his employers.  He kept something
for himself and tried to move it through a fence in Amsterdam. 
He still wasn't sure how he'd been discovered, not that it
mattered now.  He'd expected to die, then, but they only smiled. 
Of course he was welcome, they told him, welcome to the
money.  And he was going to need it.  Because -- still smiling --
they were going to make sure he never worked again.
  They damaged his nervous system with a wartime Russian
mycotoxin.
  Strapped to a bed in a Memphis hotel, his talent burning
out micron by micron, he hallucinated for thirty hours.
  The damage was minute, subtle, and utterly effective.
  For Case, who'd lived for the bodiless exultation of cyber-
space, it was the Fall.  In the bars he'd frequented as a cowboy
hotshot, the elite stance involved a certain relaxed contempt
for the flesh.  The body was meat.  Case fell into the prison of
his own flesh.

  His total assets were quickly converted to New Yen, a fat
sheaf of the old paper currency that circulated endlessly through
the closed circuit of the world's black markets like the seashells
of the Trobriand islanders.  It was difficult to transact legitimate
business with cash in the Sprawl; in Japan, it was already
illegal.
  In Japan, he'd known with a clenched and absolute certainty,
he'd find his cure.  In Chiba.  Either in a registered clinic or in
the shadowland of black medicine.  Synonymous with implants,
nerve-splicing, and microbionics, Chiba was a magnet for the
Sprawl's techno-criminal subcultures.
  In Chiba, he'd watched his New Yen vanish in a two-month
round of examinations and consultations.  The men in the black
clinics, his last hope, had admired the expertise with which
he'd been maimed, and then slowly shaken their heads.
  Now he slept in the cheapest coffins, the ones nearest the
port, beneath the quartz-halogen floods that lit the docks all
night like vast stages; where you couldn't see the lights of
Tokyo for the glare of the television sky, not even the towering
hologram logo of the Fuji Electric Company, and Tokyo Bay
was a black expanse where gulls wheeled above drifting shoals
of white styrofoam.  Behind the port lay the city, factory domes
dominated by the vast cubes of corporate arcologies.  Port and
city were divided by a narrow borderland of older streets, an
area with no official name.  Night City, with Ninsei its heart. 
By day, the bars down Ninsei were shuttered and featureless,
the neon dead, the holograms inert, waiting, under the poisoned
silver sky.

  Two blocks west of the Chat, in a teashop called the Jarre
de Th, Case washed down the night's first pill with a double
espresso.  It was a flat pink octagon, a potent species of Bra-
zilian dex he bought from one of Zone's girls.
  The Jarre was walled with mirrors, each panel framed in
red neon.
  At first, finding himself alone in Chiba, with little money
and less hope of finding a cure, he'd gone into a kind of terminal
overdrive, hustling fresh capital with a cold intensity that had
seemed to belong to someone else.  In the first month, he'd
killed two men and a woman over sums that a year before
would have seemed ludicrous.  Ninsei wore him down until the
street itself came to seem the externalization of some death
wish, some secret poison he hadn't known he carried.
  Night City was like a deranged experiment in social Dar-
winism, designed by a bored researcher who kept one thumb
permanently on the fast-forward button.  Stop hustling and you
sank without a trace, but move a little too swiftly and you'd
break the fragile surface tension of the black market; either
way, you were gone, with nothing left of you but some vague
memory in the mind of a fixture like Ratz, though heart or
lungs or kidneys might survive in the service of some stranger
with New Yen for the clinic tanks.
  Biz here was a constant subliminal hum, and death the
accepted punishment for laziness, carelessness, lack of grace,
the failure to heed the demands of an intricate protocol.
  Alone at a table in the Jarre de Th, with the octagon coming
on, pinheads of sweat starting from his palms, suddenly aware
of each tingling hair on his arms and chest, Case knew that at
some point he'd started to play a game with himself, a very
ancient one that has no name, a final solitaire.  He no longer
carried a weapon, no longer took the basic precautions.  He ran
the fastest, loosest deals on the street, and he had a reputation
for being able to get whatever you wanted.  A part of him knew
that the arc of his self-destruction was glaringly obvious to his
customers, who grew steadily fewer, but that same part of him
basked in the knowledge that it was only a matter of time.  And
that was the part of him, smug in its expectation of death, that
most hated the thought of Linda Lee.
  He'd found her, one rainy night, in an arcade.
  Under bright ghosts burning through a blue haze of cigar-
ette smoke, holograms of Wizard's Castle, Tank War Europa,
the New York skyline...  And now he remembered her that
way, her face bathed in restless laser light, features reduced to
a code: her cheekbones flaring scarlet as Wizard's Castle burned,
forehead drenched with azure when Munich fell to the Tank
War, mouth touched with hot gold as a gliding cursor struck
sparks from the wall of a skyscraper canyon.  He was riding
high that night, with a brick of Wage's ketamine on its way
to Yokohama and the money already in his pocket.  He'd come
in out of the warm rain that sizzled across the Ninsei pavement
and somehow she'd been singled out for him, one face out of
the dozens who stood at the consoles, lost in the game she
played.  The expression on her face, then, had been the one
he'd seen, hours later, on her sleeping face in a portside coffin,
her upper lip like the line children draw to represent a bird in
flight.
  Crossing the arcade to stand beside her, high on the deal
he'd made, he saw her glance up.  Gray eyes rimmed with
smudged black paintstick.  Eyes of some animal pinned in the
headlights of an oncoming vehicle.
  Their night together stretching into a morning, into tickets
at the hoverport and his first trip across the Bay.  The rain kept
up, falling along Harajuku, beading on her plastic jacket, the
children of Tokyo trooping past the famous boutiques in white
loafers and clingwrap capes, until she'd stood with him in the
midnight clatter of a pachinko parlor and held his hand like a
child.
  It took a month for the gestalt of drugs and tension he moved
through to turn those perpetually startled eyes into wells of
reflexive need.  He'd watched her personality fragment, calving
like an iceberg, splinters drifting away, and finally he'd seen
the raw need, the hungry armature of addiction.  He'd watched
her track the next hit with a concentration that reminded him
of the mantises they sold in stalls along Shiga, beside tanks of
blue mutant carp and crickets caged in bamboo.
  He stared at the black ring of grounds in his empty cup.  It
was vibrating with the speed he'd taken.  The brown laminate
of the tabletop was dull with a patina of tiny scratches.  With
the dex mounting through his spine he saw the countless random
impacts required to create a surface like that.  The Jarre was
decorated in a dated, nameless style from the previous century,
an uneasy blend of Japanese traditional and pale Milanese plas-
tics, but everything seemed to wear a subtle film, as though
the bad nerves of a million customers had somehow attacked
the mirrors and the once glossy plastics, leaving each surface
fogged with something that could never be wiped away.
  'Hey.  Case, good buddy...'
  He looked up, met gray eyes ringed with paintstick.  She
was wearing faded French orbital fatigues and new white sneak-
ers.
  'I been lookin'~ for you, man.'  She took a seat opposite
him, her elbows on the table.  The sleeves of the blue zipsuit
had been ripped out at the shoulders; he automatically checked
her arms for signs of derms or the needle.  'Want a cigarette?'
  She dug a crumpled pack of Yeheyuan filters from an ankle
pocket and offered him one.  He took it, let her light it with a
red plastic tube.  'You sleepin'~ okay, Case?  You look tired.' 
Her accent put her south along the Sprawl, toward Atlanta. 
The skin below her eyes was pale and unhealthy-looking, but
the flesh was still smooth and firm.  She was twenty.  New lines
of pain were starting to etch themselves permanently at the
corners of her mouth.  Her dark hair was drawn back, held by
a band of printed silk.  The pattern might have represented
microcircuits, or a city map.
  'Not if I remember to take my pills,' he said, as a tangible
wave of longing hit him, lust and loneliness riding in on the
wavelength of amphetamine.  He remembered the smell of her
skin in the overheated darkness of a coffin near the port, her
fingers locked across the small of his back.
  All the meat, he thought, and all it wants.
  'Wage,' she said, narrowing her eyes.  'He wants to see
you with a hole in your face.'  She lit her own cigarette.
  'Who says?  Ratz?  You been talking to Ratz?'
  'No.  Mona.  Her new squeeze is one of Wage's boys.'
  'I don't owe him enough.  He does me, he's out the money
anyway.'  He shrugged.
  'Too many people owe him now, Case.  Maybe you get to
be the example.  You seriously better watch it.'
  'Sure.  How about you, Linda?  You got anywhere to sleep?'
  'Sleep.'  She shook her head.  'Sure, Case.'  She shivered,
hunched forward over the table.  Her face was filmed with
sweat.
  'Here,' he said, and dug in the pocket of his windbreaker,
coming up with a crumpled fifty.  He smoothed it automatically,
under the table, folded it in quarters, and passed it to her.
  'You need that, honey.  You better give it to Wage.'  There
was something in the gray eyes now that he couldn't read,
something he'd never seen there before.
  'I owe Wage a lot more than that.  Take it.  I got more
coming,' he lied, as he watched his New Yen vanish into a
zippered pocket.
  'You get your money, Case, you find Wage quick.'
  'I'll see you, Linda,' he said, getting up.
  'Sure.'  A millimeter of white showed beneath each of her
pupils.  Sanpaku.  'You watch your back, man.'
  He nodded, anxious to be gone.
  He looked back as the plastic door swung shut behind him,
saw her eyes reflected in a cage of red neon.

  Friday night on Ninsei.
  He passed yakitori stands and massage parlors, a franchised
coffee shop called Beautiful Girl, the electronic thunder of an
arcade.  He stepped out of the way to let a dark-suited sarariman
by, spotting the Mitsubishi-Genentech logo tattooed across the
back of the man's right hand.
  Was it authentic?  If that's for real, he thought, he's in for
trouble.  If it wasn't, served him right.  M-G employees above
a certain level were implanted with advanced microprocessors
that monitored mutagen levels in the bloodstream.  Gear like
that would get you rolled in Night City, rolled straight into a
black clinic.
  The sarariman had been Japanese, but the Ninsei crowd was
a gaijin crowd.  Groups of sailors up from the port, tense solitary
tourists hunting pleasures no guidebook listed, Sprawl heavies
showing off grafts and implants, and a dozen distinct species
of hustler, all swarming the street in an intricate dance of desire
and commerce.
  There were countless theories explaining why Chiba City
tolerated the Ninsei enclave, but Case tended toward the idea
that the Yakuza might be preserving the place as a kind of
historical park, a reminder of humble origins.  But he also
saw a certain sense in the notion that burgeoning technologies
require outlaw zones, that Night City wasn't there for its in-
habitants, but as a deliberately unsupervised playground for
technology itself.
  Was Linda right, he wondered, staring up at the lights? 
Would Wage have him killed to make an example?  It didn't
make much sense, but then Wage dealt primarily in proscribed
biologicals, and they said you had to be crazy to do that.
  But Linda said Wage wanted him dead.  Case's primary
insight into the dynamics of street dealing was that neither the
buyer nor the seller really needed him.  A middleman's business
is to make himself a necessary evil.  The dubious niche Case
had carved for himself in the criminal ecology of Night City
had been cut out with lies, scooped out a night at a time with
betrayal.  Now, sensing that its walls were starting to crumble,
he felt the edge of a strange euphoria.
  The week before, he'd delayed transfer of a synthetic glan-
dular extract, retailing it for a wider margin than usual.  He
knew Wage hadn't liked that.  Wage was his primary supplier,
nine years in Chiba and one of the few gaijin dealers who'd
managed to forge links with the rigidly stratified criminal es-
tablishment beyond Night City's borders.  Genetic materials and
hormones trickled down to Ninsei along an intricate ladder of
fronts and blinds.  Somehow Wage had managed to trace some-
thing back, once, and now he enjoyed steady connections in a
dozen cities.
  Case found himself staring through a shop window.  The
place sold small bright objects to the sailors.  Watches, flic-
knives, lighters, pocket VTRs, simstim decks, weighted man-
riki chains, and shuriken.  The shuriken had always fascinated
him, steel stars with knife-sharp points.  Some were chromed,
others black, others treated with a rainbow surface like oil on
water.  But the chrome stars held his gaze.  They were mounted
against scarlet ultrasuede with nearly invisible loops of nylon
fishline, their centers stamped with dragons or yinyang sym-
bols.  They caught the street's neon and twisted it, and it came
to Case that these were the stars under which he voyaged, his
destiny spelled out in a constellation of cheap chrome.
  'Julie,' he said to his stars.  'Time to see old Julie.  He'll
know.'

  Julius Deane was one hundred and thirty-five years old, his
metabolism assiduously warped by a weekly fortune in serums
and hormones.  His primary hedge against aging was a yearly
pilgrimage to Tokyo, where genetic surgeons re-set the code
of his DNA, a procedure unavailable in Chiba.  Then he'd fly
to Hongkong and order the year's suits and shirts.  Sexless and
inhumanly patient, his primary gratification seemed to lie in
his devotion to esoteric forms of tailor-worship.  Case had never
seen him wear the same suit twice, although his wardrobe
seemed to consist entirely of meticulous reconstructions of gar-
ments of the previous century.  He affected prescription lenses,
framed in spidery gold, ground from thin slabs of pink synthetic
quartz and beveled like the mirrors in a Victorian dollhouse.
  His offices were located in a warehouse behind Ninsei, part
of which seemed to have been sparsely decorated, years before,
with a random collection of European furniture, as though
Deane had once intended to use the place as his home.  Neo- 
Aztec bookcases gathered dust against one wall of the room
where Case waited.  A pair of bulbous Disney-styled table lamps
perched awkwardly on a low Kandinsky-look coffee table in
scarlet-lacquered steel.  A Dali clock hung on the wall between
the bookcases, its distorted face sagging to the bare concrete
floor.  Its hands were holograms that altered to match the con-
volutions of the face as they rotated, but it never told the correct
time.  The room was stacked with white fiberglass shipping
modules that gave off the tang of preserved ginger.
  'You seem to be clean, old son,' said Deane's disembodied
voice.  'Do come in.'
  Magnetic bolts thudded out of position around the massive
imitation-rosewood door to the left of the bookcases.  JULIUS
DEANE IMPORT EXPORT was lettered across the plastic in
peeling self-adhesive capitals.  If the furniture scattered in
Deane's makeshift foyer suggested the end of the past century,
the office itself seemed to belong to its start.
  Deane's seamless pink face regarded Case from a pool of
light cast by an ancient brass lamp with a rectangular shade of
dark green glass.  The importer was securely fenced behind a
vast desk of painted steel, flanked on either side by tall, draw-
ered cabinets made of some sort of pale wood.  The sort of
thing, Case supposed, that had once been used to store written
records of some kind.  The desktop was littered with cassettes,
scrolls of yellowed printout, and various parts of some sort of
clockwork typewriter, a machine Deane never seemed to get
around to reassembling.
  'What brings you around, boyo?' Deane asked, offering
Case a narrow bonbon wrapped in blue-and-white checked pa-
per.  'Try one.  Ting Ting Djahe, the very best.'  Case refused
the ginger, took a seat in a yawing wooden swivel chair, and
ran a thumb down the faded seam of one black jeans-leg.  'Julie,
I hear Wage wants to kill me.'
  'Ah.  Well then.  And where did you hear this, if I may?'
  'People.'
  'People,' Deane said, around a ginger bonbon.  'What sort
of people?  Friends?'
  Case nodded.
  'Not always that easy to know who your friends are, is it?'
  'I do owe him a little money, Deane.  He say anything to
you?'
  'Haven't been in touch, of late.'  Then he sighed.  'If I _did_
know, of course, I might not be in a position to tell you.  Things
being what they are, you understand.'
  'Things?'
  'He's an important connection, Case.'
  'Yeah.  He want to kill me, Julie?'
  'Not that I know of.'  Deane shrugged.  They might have
been discussing the price of ginger.  'If it proves to be an
unfounded rumor, old son, you come back in a week or so and
I'll let you in on a little something out of Singapore.'
  'Out of the Nan Hai Hotel, Bencoolen Street?'
  'Loose lips, old son!'  Deane grinned.  The steel desk was
jammed with a fortune in debugging gear.
  'Be seeing you, Julie.  I'll say hello to Wage.'
  Deane's fingers came up to brush the perfect knot in his
pale silk tie.

  He was less than a block from Deane's office when it hit,
the sudden cellular awareness that someone was on his ass,
and very close.
  The cultivation of a certain tame paranoia was something
Case took for granted.  The trick lay in not letting it get out of
control.  But that could be quite a trick, behind a stack of
octagons.  He fought the adrenaline surge and composed his
narrow features in a mask of bored vacancy, pretending to let
the crowd carry him along.  When he saw a darkened display
window, he managed to pause by it.  The place was a surgical
boutique, closed for renovations.  With his hands in the pockets
of his jacket, he stared through the glass at a flat lozenge of
vatgrown flesh that lay on a carved pedestal of imitation jade. 
The color of its skin reminded him of Zone's whores; it was
tattooed with a luminous digital display wired to a subcutaneous
chip.  Why bother with the surgery, he found himself thinking,
while sweat coursed down his ribs, when you could just carry
the thing around in your pocket?
  Without moving his head, he raised his eyes and studied
the reflection of the passing crowd.
  There.
  Behind sailors in short-sleeved khaki.  Dark hair, mirrored
glasses, dark clothing, slender...
  And gone.
  Then Case was running, bent low, dodging between bodies.

  'Rent me a gun, Shin?'
  The boy smiled.  'Two hour.'  They stood together in the
smell of fresh raw seafood at the rear of a Shiga sushi stall. 
'You come back, two hour.'
  'I need one now, man.  Got anything right now?'
  Shin rummaged behind empty two-liter cans that had once
been filled with powdered horseradish.  He produced a slender
package wrapped in gray plastic.  'Taser.  One hour, twenty
New Yen.  Thirty deposit.'
  'Shit.  I don't need that.  I need a gun.  Like I maybe wanna
shoot somebody, understand?'
  The waiter shrugged, replacing the taser behind the horse-
radish cans.  'Two hour.'

  He went into the shop without bothering to glance at the
display of shuriken.  He'd never thrown one in his life.
  He bought two packs of Yeheyuans with a Mitsubishi Bank
chip that gave his name as Charles Derek May.  It beat Truman
Starr, the best he'd been able to do for a passport.
  The Japanese woman behind the terminal looked like she
had a few years on old Deane, none of them with the benefit
of science.  He took his slender roll of New Yen out of his
pocket and showed it to her.  'I want to buy a weapon.'
  She gestured in the direction of a case filled with knives.
  'No,' he said, 'I don't like knives.'
  She brought an oblong box from beneath the counter.  The
lid was yellow cardboard, stamped with a crude image of a
coiled cobra with a swollen hood.  Inside were eight identical
tissue-wrapped cylinders.  He watched while mottled brown
fingers stripped the paper from one.  She held the thing up for
him to examine, a dull steel tube with a leather thong at one
end and a small bronze pyramid at the other.  She gripped the
tube with one hand, the pyramid between her other thumb and
forefinger, and pulled.  Three oiled, telescoping segments of
tightly wound coilspring slid out and locked.  'Cobra,' she said.

  Beyond the neon shudder of Ninsei, the sky was that mean
shade of gray.  The air had gotten worse; it seemed to have
teeth tonight, and half the crowd wore filtration masks.  Case
had spent ten minutes in a urinal, trying to discover a convenient
way to conceal his cobra; finally he'd settled for tucking the
handle into the waistband of his jeans, with the tube slanting
across his stomach.  The pyramidal striking tip rode between
his ribcage and the lining of his windbreaker.  The thing felt
like it might clatter to the pavement with his next step, but it
made him feel better.
  The Chat wasn't really a dealing bar, but on weeknights it
attracted a related clientele.  Fridays and Saturdays were dif-
ferent.  The regulars were still there, most of them, but they
faded behind an influx of sailors and the specialists who preyed
on them.  As Case pushed through the doors, he looked for
Ratz, but the bartender wasn't in sight.  Lonny Zone, the bar's
resident pimp, was observing with glazed fatherly interest as
one of his girls went to work on a young sailor.  Zone was
addicted to a brand of hypnotic the Japanese called Cloud
Dancers.  Catching the pimp's eye, Case beckoned him to the
bar.  Zone came drifting through the crowd in slow motion, his
long face slack and placid.
  'You seen Wage tonight, Lonny?'
  Zone regarded him with his usual calm.  He shook his head.
  'You sure, man?'
  'Maybe in the Namban.  Maybe two hours ago.'
  'Got some joeboys with him?  One of 'em thin, dark hair,
maybe a black jacket?'
  'No,' Zone said at last, his smooth forehead creased to
indicate the effort it cost him to recall so much pointless detail. 
'Big boys.  Graftees.'  Zone's eyes showed very little white and
less iris; under the drooping lids, his pupils were dilated and
enormous.  He stared into Case's face for a long time, then
lowered his gaze.  He saw the bulge of the steel whip.  'Cobra,'
he said, and raised an eyebrow.  'You wanna fuck somebody
up?'
  'See you, Lonny.'  Case left the bar.`,
};

embedDriveItem(googleDocExample).then((data) => {
  console.log(data);
});
