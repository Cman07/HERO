"""Build an edited, narrated walkthrough from actual browser screenshots.
Requires Pillow, macOS say, and FFMPEG_BIN pointing to a trusted FFmpeg binary.
No browser automation, credentials or resident records are accessed here.
"""
import json, os, re, subprocess, tempfile, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'demo'
WORK = Path(tempfile.mkdtemp(prefix='hero-video-'))
FFMPEG = os.environ['FFMPEG_BIN']
chapters = [
 (30,'A clearer next step','home-disasters.png','Virginia Disaster Assistance Navigator',[
  'Guest access', 'A useful plan before AI', 'Resident-controlled summary'],
  'HERO helps Virginia residents find a clearer next step after a disaster. A resident may know what they need, but still face uncertainty about what to do first and what to ask a helper. This walkthrough uses fictional information and actual local browser captures. HERO provides a curated recovery plan, optional AI explanation, and a reviewed summary that the resident controls.'),
 (60,'From need to recovery plan','recovery-desktop.png','Rules choose the actions',[
  'Three questions', 'Distinct tasks for five needs', 'Reasons, sources and review dates', 'Progress reported by the resident'],
  'The guest journey starts with three short questions. First, HERO checks for immediate danger and directs emergencies to nine one one. Next, the resident selects a current Virginia county or independent city, or skips that question. Finally, they choose a need. A deterministic plan appears before the AI reply. Housing, supplies, property damage, in person assistance, and an uncertain need each have different tasks. In this fictional property damage example, the resident has reviewed the official application route. The next incomplete action is now prominent: confirm where the damage occurred. Current locality, saved home locality, and damage locality are separate. Each action explains why it was selected and includes an approved federal destination and review date. Completion means the resident marked a step; it does not confirm an agency action. Progress survives refresh in the same tab and resets when the intake or account changes.'),
 (45,'A bounded role for Foundry','live-foundry.png','Genuine provider response',[
  'Server-built candidate actions', 'Validated reply and action IDs', 'Catalog-rendered titles and links', 'Status reflects a received reply'],
  'This captured response came from the configured Microsoft Foundry agent. It explains why the location of damage matters, using an action already in the recovery plan. The server supplies approved candidate actions and validated resident reported completion. The model must return a short reply and up to three known action identifiers. HERO rejects malformed output, unknown actions, excessive text, and prohibited links. It renders action titles and destinations from its own catalog. The interface only says AI reply received after a successful response. Foundry cannot check the nearest recovery center, determine eligibility, submit an application, or mark tasks complete. Invalid output leaves the resident plan available.'),
 (45,'Prepare a summary for a helper','helper-preview.png','Review the exact export text',[
  'Need, localities and progress', 'Editable unresolved questions', 'Optional home and size selection', 'No automatic helper contact'],
  'The resident can prepare a summary without relying on AI. The review includes their stated need, current locality, explicitly selected damage locality, completed and remaining actions, approved links, language, and date. They can add unresolved questions and edit the exact text that will be exported. Saved home locality and household size are included only after separate selection here. Saved health, disability, and support answers, and the chat history, are excluded. Summary edits stay in page memory and are never sent to Foundry. Printing, text download, and a copy fallback support a portable handoff. Exporting does not contact a helper, reserve assistance, or create a case record.'),
 (45,'Preparedness stays personal','preparedness.png','Existing household tailoring',[
  'Optional household survey', 'Locally selected tasks', 'Encrypted SQLite profile', 'Separate preparedness progress'],
  'HERO also retains the existing preparedness journey. This fictional household has selected children and a need to plan for powered medical equipment. Local rules add relevant preparation tasks, including discussing backup arrangements with a care team or equipment provider. Those saved support answers do not enter the AI request or the recovery helper summary. Preparedness completion is stored with the encrypted local profile. Recovery progress remains separate in the current tab. Accounts are optional, and saved profiles stay on the host computer. Residents should keep exported copies private. Encryption protects stored payloads, while access to both the database and its key remains an important host security boundary.'),
 (20,'English and Spanish','recovery-spanish.png','The same resident journey',[
  'Translated interface and actions', 'Translated export boilerplate', 'User edits keep their own text'],
  'English and Spanish cover the intake, recovery actions, explanations, and export boilerplate. The catalog preserves the same action identifiers and approved destinations in both languages. Resident written questions are not silently translated. Professional Spanish review remains a release check.'),
 (15,'A cached public guide','offline-guide.png','Server stopped for this check',[
  'Public shell remains available', 'Private APIs are never cached', 'Live services need a connection'],
  'Here the isolated demo server was stopped and the public guide still loaded. The notice explains which services require a connection. Accounts, saved profiles, chat, and FEMA responses are excluded from the public cache.'),
 (25,'Controlled AI failure','ai-unavailable.png','Provider deliberately unconfigured',[
  'AI unavailable is explicit', 'Recovery plan remains usable', 'Helper review stays available'],
  'This is a controlled failure demonstration with the AI provider deliberately unconfigured. It is not a claim of an Azure outage. The status says AI unavailable, while the food and supplies plan, helper review, and export controls remain usable. The resident can continue working from curated guidance and approved destinations. No model response is needed to obtain a meaningful plan.'),
 (15,'Evidence and practical limits',None,'44 automated tests pass',[
  'Live English: 1,508 ms', 'Live Spanish: 2,331 ms', 'Human participants: 0', 'See the full verification record'],
  'All forty four automated tests pass. The final English and Spanish live checks succeeded. These are synthetic observations, with no human participants. HERO provides guidance and a portable summary; it does not guarantee assistance or outcomes.')
]
assert sum(c[0] for c in chapters)==300
fontfile='/System/Library/Fonts/Supplemental/Arial.ttf'
boldfile='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(size,bold=False): return ImageFont.truetype(boldfile if bold else fontfile,size)
def wrap(draw,text,x,y,width,f,fill,spacing=9):
 words=text.split(); line=''
 for word in words:
  candidate=(line+' '+word).strip()
  if draw.textlength(candidate,font=f)>width and line:
   draw.text((x,y),line,font=f,fill=fill); y+=f.size+spacing; line=word
  else: line=candidate
 if line: draw.text((x,y),line,font=f,fill=fill); y+=f.size+spacing
 return y
transcript=['# HERO: narrated walkthrough','', 'Edited browser captures · fictional data · local system-voice narration','']
subtitles=[]; cursor=0; segments=[]; records=[]
def stamp(sec):
 ms=round(sec*1000); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
for i,(duration,title,shot,kicker,bullets,narration) in enumerate(chapters):
 frame=Image.new('RGB',(1280,720),'#fbfaf5'); d=ImageDraw.Draw(frame)
 d.rectangle((0,0,1280,100),fill='#0a3922')
 d.text((34,21),'HERO',font=font(42,True),fill='#d2f2e3')
 d.text((190,26),title,font=font(31,True),fill='white')
 d.text((36,674),'EDITED BROWSER CAPTURES  •  FICTIONAL DATA  •  SEPTEMBER 2026',font=font(17),fill='#486354')
 d.text((1170,674),f'{i+1:02} / 09',font=font(17),fill='#486354')
 if shot:
  screen=Image.open(ROOT/'docs/screenshots'/shot).convert('RGB')
  # Some embedded-browser captures include empty right-hand canvas. Crop only
  # that empty margin; preserve the actual UI content and proportions.
  if screen.size==(800,500): screen=screen.crop((0,0,490,500))
  if shot=='recovery-desktop.png': screen=screen.crop((0,0,800,min(900,screen.height)))
  screen.thumbnail((714,535),Image.Resampling.LANCZOS)
  x=34+(714-screen.width)//2; y=114+(535-screen.height)//2
  frame.paste(screen,(x,y)); d.rounded_rectangle((x-1,y-1,x+screen.width+1,y+screen.height+1),radius=3,outline='#b8cec1',width=2)
  tx=790; tw=440
 else:
  d.rounded_rectangle((40,135,735,625),radius=30,fill='#d2f2e3')
  d.text((95,180),'44',font=font(130,True),fill='#0a3922')
  wrap(d,'Tests passing',100,330,580,font(44,True),'#0a3922')
  wrap(d,'Rules select actions. Foundry explains. Residents review and export.',100,420,530,font(29),'#0a3922')
  tx=790;tw=440
 y=wrap(d,kicker,tx,147,tw,font(30,True),'#0a3922',10)+25
 for bullet in bullets:
  d.ellipse((tx,y+9,tx+9,y+18),fill='#f77954')
  y=wrap(d,bullet,tx+25,y,tw-25,font(25),'#244735',10)+24
 framepath=WORK/f'{i:02}.png'; frame.save(framepath)
 script=WORK/f'{i:02}.txt'; script.write_text(narration)
 audio=WORK/f'{i:02}.aiff'
 subprocess.run(['say','-v','Samantha','-r','156','-f',str(script),'-o',str(audio)],check=True)
 # Inspect audio duration before using a fixed chapter length; never truncate narration.
 info=subprocess.run([FFMPEG,'-hide_banner','-i',str(audio)],capture_output=True,text=True).stderr
 match=re.search(r'Duration: (\d+):(\d+):([\d.]+)',info)
 if not match: raise RuntimeError('Could not inspect narration')
 voice_seconds=int(match[1])*3600+int(match[2])*60+float(match[3])
 if voice_seconds>duration-0.2: raise RuntimeError(f'Chapter {i+1} narration exceeds duration: {voice_seconds}')
 target=WORK/f'{i:02}.mp4'
 subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-loop','1','-framerate','10','-i',str(framepath),'-i',str(audio),'-t',str(duration),'-c:v','libx264','-preset','ultrafast','-crf','22','-tune','stillimage','-pix_fmt','yuv420p','-vf','fps=10','-af','apad','-c:a','aac','-ar','48000','-b:a','128k',str(target)],check=True)
 segments.append(target)
 transcript += [f'## {cursor//60}:{cursor%60:02}–{(cursor+duration)//60}:{(cursor+duration)%60:02} · {title}','',narration,'']
 # Sentence captions are evenly placed over this chapter's measured narration.
 sentences=re.split(r'(?<=[.!?])\s+',narration); total=sum(len(s.split()) for s in sentences); scursor=float(cursor)
 for sentence in sentences:
  end=scursor+voice_seconds*len(sentence.split())/total
  subtitles.append(f'{len(subtitles)+1}\n{stamp(scursor)} --> {stamp(end)}\n'+ '\n'.join(textwrap.wrap(sentence,75))+'\n')
  scursor=end
 records.append({'chapter':i+1,'title':title,'startSeconds':cursor,'durationSeconds':duration,'narrationSeconds':voice_seconds,'screenshot':shot})
 cursor+=duration
 print(f'Encoded chapter {i+1}: {title}',flush=True)
concat=WORK/'concat.txt'; concat.write_text('\n'.join("file '"+str(s)+"'" for s in segments))
subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-t','299.9','-c','copy','-movflags','+faststart',str(OUT/'hero-five-minute-demo.mp4')],check=True)
(OUT/'transcript.md').write_text('\n'.join(transcript))
(OUT/'captions.srt').write_text('\n'.join(subtitles))
(OUT/'recording.json').write_text(json.dumps({'format':'Edited browser captures with local system-voice narration','durationSeconds':299.9,'chapters':records},indent=2)+'\n')
print('Completed:',OUT/'hero-five-minute-demo.mp4',flush=True)
