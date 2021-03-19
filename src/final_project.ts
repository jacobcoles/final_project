import { MachineConfig, actions, Action, assign } from "xstate";
const { send, cancel } = actions;



function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string, bool_val?: boolean, initial_function: string } } = {
    //~ "john": { person: "John Appleseed" },
    //~ "sarah": { person: "Sarah Swiggity" },
    //~ "daddy": { person: "The big lad" },
    //~ "on monday": { day: "Friday" },
    //~ "on tuesday": { day: "Thursday" },
    //~ "on wednesday": { day: "Friday" },
    //~ "on thursday": { day: "Thursday" },
    //~ "on friday": { day: "Friday" },
    //~ "on saturday": { day: "Thursday" },
    //~ "on sunday": { day: "Friday" },
    //~ "at 8": { time: "8:00" },
    //~ "at 9": { time: "9:00" },
    //~ "at 10": { time: "10:00" },
    //~ "at 11": { time: "11:00" },
    //~ "at 12": { time: "12:00" },
    //~ "at 13": { time: "13:00" },
    //~ "at 14": { time: "14:00" },
    //~ "at 15": { time: "15:00" },
    //~ "at 16": { time: "16:00" },
    //~ "8": { time: "8:00" },
    //~ "9": { time: "9:00" },
    //~ "10": { time: "10:00" },
    //~ "11": { time: "11:00" },
    //~ "12": { time: "12:00" },
    //~ "13": { time: "13:00" },
    //~ "14": { time: "14:00" },
    //~ "15": { time: "15:00" },
    //~ "16": { time: "16:00" },
    //~ "yes": { bool_val: true },
	//~ "yeah": { bool_val: true },
	//~ "ok": { bool_val: true },
	//~ "sure": { bool_val: true },
	//~ "ja": { bool_val: true },
    //~ "no": { bool_val: false },
	//~ "nope": { bool_val: false },
	//~ "nein": { bool_val: false },
	//~ "nej": { bool_val: false },
	//~ "appointment": { initial_function: "appt" },
	//~ "an appointment": { initial_function: "appt" },
	//~ "set up an appointment": { initial_function: "appt" },
	//~ "make an appointment": { initial_function: "appt" },
	//~ "to do": { initial_function: "todo" },
	//~ "set up a to do": { initial_function: "todo" },
	//~ "make to do": { initial_function: "todo" },
	//~ "make a to do": { initial_function: "todo" },
	//~ "timer": { initial_function: "timer" },
	//~ "make a timer": { initial_function: "timer" },
	//~ "set a timer": { initial_function: "timer" },
	//~ "set timer": { initial_function: "timer" },

	"quick math": { quick_math: null },
	"quick maths": { quick_math: null },
	"play quick math": { quick_math: null },
	"play quick maths": { quick_math: null },
	
	"riddles": { riddles: null },
	"riddle": { riddles: null },
	"tell me a riddle": { riddles: null },
	"play riddles": { riddles: null },
	
	"chimp test": { chimp_test: null },
	"play chimp test": { chimp_test: null },
	"play the chimp test": { chimp_test: null },
	"the chimp test": { chimp_test: null },
		
	
}

const riddles_store = {
	0: {
		riddle: "What has to be broken before you can use it?",
		answers: [
			"egg",
			"an egg",
		],
		hint: "I like them scrambled. "
	},
	1: {
		riddle: "What gets wet while drying?",
		answers: [
			"towel",
			"a towel",
			"towels",
		],
		hint: "You'll have to take one to the beach if you want to take a swim. "
	},
	2: {
		riddle: "What can you give and still hold on to?",
		answers: [
			"promise",
			"a promise",
			"promises",
			"your word"
		],
		hint: "Relationships are more secure with these. "
	},
	3: {
		riddle: "The more of this there is, the less you see. What is it?",
		answers: [
			"darkness",
			"the dark",
		],
		hint: "This descibes the absence rather than the presence of something. "
	},
	4: {
		riddle: "This is as light as a feather, but you can't hold it too long. ",
		answers: [
			"your breath",
			"breath",
			"the breath",
			"a breath"
		],
		hint: "Don't forget to do this or you'll die."
	},
	5: {
		riddle: "Before Mount Everest was discovered, what was the highest mountain on Earth?",
		answers: [
			"everest",
			"mount everest"
		],
		hint: "If nobody is there to observe it does that mean it is not true?"
	},
	6: {
		riddle: "What runs around the whole yard without moving?",
		answers: [
			"a fence",
			"fence",
			"fences",
		],
		hint: "Some things described as running may be static. "
	},
	7: {
		riddle: "What can you catch, but never throw?",
		answers: [
			"a cold",
			"a virus",
			"a sickness",
			"a disease",
			"cold",
			"virus",
			"sickness",
			"disease",
			"colds",
			"viruses",
			"sicknesses",
			"diseases",
		],
		hint: "Covid 19 has not been a great thing for the world. "
	},
	
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
	
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {
                entry: [
					send('LISTEN'),
					send( 'MAXSPEECH', { delay: 4000, id: 'maxspeech_cancel' } )
				]
            },
        }
    })
}

const proxyurl = "https://cors-anywhere.herokuapp.com/" // can try instead "https://boiling-depths-26621.herokuapp.com/"
const rasaurl = 'https://rasajacobcoles.herokuapp.com/model/parse'
function nluRequest(): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
		initial: 'http_timeout',
		invoke: {
			id: "rasaquery",
			src: (context, event) => {
				
				return fetch(new Request(proxyurl + rasaurl, {
		        method: 'POST',
		        headers: { 'Origin': 'http://localhost:3000/' }, // only required with proxy
		        body: `{"text": "${context.query}"}`
				}))
		        .then(data => data.json());

			},
			onDone: [
				{
					target: '.invalid_query',
					cond: (context, event)=> { return ((event.data.intent.confidence) < 0.7) }
				},
				{
					target: '.valid_query',
                    actions: [
						assign((context, event) => { return {snippet: event.data.intent.name }}),
						(context:SDSContext, event:any) => console.log(event.data),
					]
				},
			],
			onError: {
					target: '#root.dm',
					actions: say("Sorry, there was an error. ")
				},
		},
		states: {
			http_timeout: {
				invoke: {
					src: (context, event) => {
						return new Promise((resolve) => {
								setTimeout(() => { resolve() }, 2000) 
							})
					},
				},
				onDone: send('HTTP_TIMEOUT')
			},
			invalid_query: {
				entry: send('INVALID_QUERY'),
			},
			valid_query: {
				entry: send('VALID_QUERY'),
			},
		},
	})
}

const commands = ['stop', 'help']

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'main',
    id: 'init',
    on: {
		MAXSPEECH: '.maxspeech',
		RECOGNISED: 
			[
				{
					target: ".stop",
					cond: (context) => context.recResult === 'stop' ,
				},
				{
					target: ".help",
					cond: (context) => context.recResult === 'help' ,
				}
			],
	},
    states: {
        main: {
			initial: 'clicky',
			states: {
				hist: {
					type: 'history',
					history: 'shallow',
				 },
				clicky: {
					on: {
						CLICK: 'begin'
					},
				},
				begin:{
					initial: "prompt",
					id: "welcome",
					on: {
						RECOGNISED: [
							{
			                    cond: (context) => "quick_math" in (grammar[context.recResult] || {}),
			                    //actions: assign((context) => { return { quick_math: grammar[context.recResult].quick_math }}),
			                    target: "quick_math"
							},
							{
								target: "riddles",
								cond: (context) => "riddles" in (grammar[context.recResult] || {}),
							},
							{
								target: "chimp_test",
								cond: (context) => "chimp_test" in (grammar[context.recResult] || {}),
							},
							{
								target: "please_repeat",
								cond: (context) => !commands.includes(context.recResult)
							},
						]
					},
					states: {
						prompt: {
							...promptAndAsk("Hellooo. You have a selection of one of the following mini games. You can choose between quick maths, riddles, or the chimp test. You can also tell me to stop or ask for help at any time. ")
						}
		            }
				},
				quick_math: {
		            id: "todo",
					initial: "prompt",
					on: {
						ENDSPEECH: "#init"
					},
					states: {
						prompt: {
							entry: say("You are in the to do thing."),
						},
					}
				},
				riddles: {
		            id: "riddles",
					initial: "prompt",
					on: {
						//~ MAXSPEECH: {
							//~ actions: say("Sorry, you have taken too")
						//~ },
						RECOGNISED: [
							{
								cond: context => riddles_store[context.riddle_id].answers.includes(context.recResult),
								actions: say("Well done, that is correct!"),
								target: '#init'
							},
							{
								cond: context => context.recResult == 'hint',
			                    target: '.hint'
							},
							{ 
								target: ".wrong_answer" ,
								cond: (context) => !commands.includes(context.recResult)
							}
						]
					},
					states: {	
						//~ hist: {
							//~ type: 'history',
							//~ history: 'shallow',
						 //~ },
						prompt: {
							entry: say("Here is your riddle"),
							on: {
								ENDSPEECH: {
									target: "ask_riddle",
									actions: assign((context) => {
										//if (!"riddle_id" in context){
											return { riddle_id: Math.floor(Math.random() * 7) }
										//}
										//return {}
									}),
								},
							},
						},
						hint: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `The hint is ${riddles_store[context.riddle_id].hint}. So`
		                    })),
						},
						ask_riddle: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `${riddles_store[context.riddle_id].riddle}.`
		                    })),
		                    on: { ENDSPEECH: "ask" }
						},
						wrong_answer: {
							entry: say("Sorry, that isn't right, try again. "),
							on: { ENDSPEECH: "ask" }
						},
						ask: {
			                entry: [
								send('LISTEN'),
								send( 'MAXSPEECH', { delay: 5000, id: 'maxspeech_cancel' } )
							],
			            },
					}
				},
				chimp_test: {
		            id: "timer",
					initial: "prompt",
					on: {
						ENDSPEECH: "#init"
					},
					states: {
						prompt: {
							entry: say("You are in the timer thing.")
						},
					}
				},
				please_repeat: {
		            id: "please_repeat",
					initial: "prompt",
					on: {
						ENDSPEECH: "#init"
					},
					states: {
						prompt: {
							entry: say("Sorry, I didn't get that. ")
						},
					},
					on: { ENDSPEECH: "#init.main.hist" }
				},
		    },
		},
		maxspeech: {
			entry: say("Sorry,"),
			on: {
				ENDSPEECH: [
					{
						cond: (context)=> context.maxspeech_count < 3,
						target: 'main.hist'
					},
					{
						actions: [
							assign((context) => { return { maxspeech_count: 0 } }),
							say("Cancelled because you don't say nutting")
						],
						target: '#init'
					}
				]
			}
		},
		stop: {
			entry: say("Ok, program stopped"),
			on: {
				ENDSPEECH: {
					target: '#init'
				},
			},
		},
		help: {
			entry: say("I'm supposed to help you but I won't"),
			on: {
				ENDSPEECH: {
					target: '#init'
				},
			},
		},
	},
})










//~ export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    //~ initial: 'init',
    //~ states: {
        //~ init: {
            //~ on: {
                //~ CLICK: 'welcome'
            //~ }
        //~ },
        //~ welcome: {
            //~ on: {
                //~ RECOGNISED: [
                    //~ { target: 'stop', cond: (context) => context.recResult === 'stop' },
                    //~ { target: 'repaint' }]
            //~ },
            //~ ...promptAndAsk("Tell me the colour")
        //~ },
        //~ stop: {
            //~ entry: say("Ok"),
            //~ always: 'init'
        //~ },
        //~ repaint: {
            //~ initial: 'prompt',
            //~ states: {
                //~ prompt: {
                    //~ entry: sayColour,
                    //~ on: { ENDSPEECH: 'repaint' }
                //~ },
                //~ repaint: {
                    //~ entry: 'changeColour',
                    //~ always: '#root.dm.welcome'
                //~ }
            //~ }
        //~ }
    //~ }
//~ })
