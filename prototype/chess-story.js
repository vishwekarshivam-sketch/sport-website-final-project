/* Original authored study; independently verified in design/club-pages/chess/sequence.json. */
export const INITIAL=[{"id": "h1", "type": "k", "color": "white", "square": "h1"}, {"id": "f1", "type": "r", "color": "white", "square": "f1"}, {"id": "a4", "type": "q", "color": "white", "square": "a4"}, {"id": "b1", "type": "n", "color": "white", "square": "b1"}, {"id": "c1", "type": "b", "color": "white", "square": "c1"}, {"id": "a2", "type": "p", "color": "white", "square": "a2"}, {"id": "b2", "type": "p", "color": "white", "square": "b2"}, {"id": "c2", "type": "p", "color": "white", "square": "c2"}, {"id": "g2", "type": "p", "color": "white", "square": "g2"}, {"id": "h2", "type": "p", "color": "white", "square": "h2"}, {"id": "g8", "type": "k", "color": "black", "square": "g8"}, {"id": "c5", "type": "q", "color": "black", "square": "c5"}, {"id": "e4", "type": "n", "color": "black", "square": "e4"}, {"id": "a8", "type": "r", "color": "black", "square": "a8"}, {"id": "c8", "type": "b", "color": "black", "square": "c8"}, {"id": "b8", "type": "n", "color": "black", "square": "b8"}, {"id": "a7", "type": "p", "color": "black", "square": "a7"}, {"id": "b7", "type": "p", "color": "black", "square": "b7"}, {"id": "c7", "type": "p", "color": "black", "square": "c7"}, {"id": "f7", "type": "p", "color": "black", "square": "f7"}, {"id": "g7", "type": "p", "color": "black", "square": "g7"}, {"id": "h7", "type": "p", "color": "black", "square": "h7"}];
export const MOVES=[{"piece": "e4", "from": "e4", "to": "f2", "san": "Nf2+", "capture": null}, {"piece": "h1", "from": "h1", "to": "g1", "san": "Kg1", "capture": null}, {"piece": "e4", "from": "f2", "to": "h3", "san": "Nh3+", "capture": null}, {"piece": "h1", "from": "g1", "to": "h1", "san": "Kh1", "capture": null}, {"piece": "c5", "from": "c5", "to": "g1", "san": "Qg1+", "capture": null}, {"piece": "f1", "from": "f1", "to": "g1", "san": "Rxg1", "capture": "c5"}, {"piece": "e4", "from": "h3", "to": "f2", "san": "Nf2#", "capture": null}];
export const FENS=["rnb3k1/ppp2ppp/8/2q5/Q3n3/8/PPP3PP/1NB2R1K b - - 0 1", "rnb3k1/ppp2ppp/8/2q5/Q7/8/PPP2nPP/1NB2R1K w - - 1 2", "rnb3k1/ppp2ppp/8/2q5/Q7/8/PPP2nPP/1NB2RK1 b - - 2 2", "rnb3k1/ppp2ppp/8/2q5/Q7/7n/PPP3PP/1NB2RK1 w - - 3 3", "rnb3k1/ppp2ppp/8/2q5/Q7/7n/PPP3PP/1NB2R1K b - - 4 3", "rnb3k1/ppp2ppp/8/8/Q7/7n/PPP3PP/1NB2RqK w - - 5 4", "rnb3k1/ppp2ppp/8/8/Q7/7n/PPP3PP/1NB3RK b - - 0 4", "rnb3k1/ppp2ppp/8/8/Q7/8/PPP2nPP/1NB3RK w - - 1 5"];
export const squarePoint=square=>[square.charCodeAt(0)-100.5,4.5-Number(square[1])];
const clamp=t=>Math.max(0,Math.min(1,t));
export function positionAt(cursor){
 const pieces=INITIAL.map(p=>{const [x,z]=squarePoint(p.square);return {...p,x,z,lift:0,scale:1};}),byId=Object.fromEntries(pieces.map(p=>[p.id,p]));
 for(let i=0;i<MOVES.length;i++){
  const t=clamp(cursor-i);if(t===0)break;
  const move=MOVES[i],piece=byId[move.piece],[ax,az]=squarePoint(move.from),[bx,bz]=squarePoint(move.to);
  piece.x=ax+(bx-ax)*t;piece.z=az+(bz-az)*t;piece.lift=Math.sin(Math.PI*t)*(piece.type==='n'?1.35:.12);
  piece.square=t===1?move.to:move.from;
  if(move.capture)byId[move.capture].scale=1-clamp((t-.12)/.55);
 }
 return pieces;
}
