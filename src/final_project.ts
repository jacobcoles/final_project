import { MachineConfig, actions, Action, assign } from "xstate";
const { send, cancel } = actions;



function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string, bool_val?: boolean, initial_function: string } } = {

	"quick math": { quick_math: null },
	"quick maths": { quick_math: null },
	"play quick math": { quick_math: null },
	"play quick maths": { quick_math: null },
	
	"riddles": { riddles: null },
	"riddle": { riddles: null },
	"tell me a riddle": { riddles: null },
	"play riddles": { riddles: null },
	
	"memory game": { chimp_test: null },
	"memory test": { chimp_test: null },
	"number test": { chimp_test: null },
	"number memory test": { chimp_test: null },
	"the memory game": { chimp_test: null },
	"the memory test": { chimp_test: null },
	"the number test": { chimp_test: null },
	"the number memory test": { chimp_test: null },
	
	
	
}


const math_operator_store = {
	operate: function(a,b,operator){
			switch(operator){
				case 'plus': 
					return a+b
				case 'subtract': 
					return a-b
				case 'times': 
					return a*b
				case 'divide':
					return a/b
			}
		},
	generate_number: function(operator){
		switch(operator){
			case 'plus': 
				return a+b
			case 'subtract': 
				return a-b
			case 'times': 
				return a*b
			case 'divide':
				return a/b
		}
	},
	parse_asr_numbers: function(input){
		const numbers = {
			0: 'zero',
			1: 'one',
			2: 'two',
			3: 'three',
			4: 'four',
			5: 'five',
			6: 'six',
			7: 'seven',
			8: 'eight',
			9: 'nine',
		}
		for (var i = 0; i < numbers.length; i++) {
			input = input.replace(numbers[i], i)
		}
		input = input.replace('for', 4)
		input = input.replace('to', 2)
		input = input.replace('too', 2)
		return input.split(/[\s--,.+]/).join('') 
	},
	0: {
		operator: "plus",
	},
	1: {
		operator: "subtract",
	},
	2: {
		operator: "times",
	},
	3: {
		operator: "divide",
	},
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
var maxspeech_count_local = 0

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'main',
    id: 'init',
    context: {
		maxspeech_count: 0,
	},
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
						CLICK: {
							target: 'begin',
							actions: assign(context=>{maxspeech_count_local = 0; return { maxspeech_count: 0 } })
						},
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
							...promptAndAsk("hello") //"Hellooo. You have a selection of one of the following mini games. You can choose between quick maths, riddles, the number memory test, or spelling. You can also tell me to stop or ask for help at any time. ")
						}
		            }
				},
				quick_math: {
		            id: "quick_math",
					initial: "prompt",
					on: {
						RECOGNISED: [
							{
								target: '.right_answer',
								cond: (context) => context.recResult === context.solution.toString()
							},
							{
								target: ".wrong_answer",
								cond: (context) => !commands.includes(context.recResult)
							},
							
						]
					},
					states: {
						prompt: {
							entry: say("Here is your maths question"),
							on: {
								ENDSPEECH: {
									target: "ask_math_question",
									actions: assign((context) => {
										return { 
											number_one: Math.floor(Math.random() * 100),
											number_two: Math.floor(Math.random() * 100),
											operator_id: Math.floor(Math.random() * 3),
										}
									}),
								},
							},
						},
						ask_math_question: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `What is ${context.number_one} ${math_operator_store[context.operator_id].operator} ${context.number_two}.`
		                    })),
		                    on: { ENDSPEECH: {
									target: "ask",
									actions: assign(context=> {
										return { solution: math_operator_store.operate(context.number_one, context.number_two, math_operator_store[context.operator_id].operator) }
									})
								}
							}
						},
						wrong_answer: {
							entry: say("Sorry, that isn't right, try again."),
							on: { ENDSPEECH: "ask" }
						},
						right_answer: {
							entry: say("Good job, that was right!"),
							on: { ENDSPEECH: "#init" }
						},
						ask: {
			                entry: [
								send('LISTEN'),
								send( 'MAXSPEECH', { delay: 7000, id: 'maxspeech_cancel' } )
							],
			            },
			        }
				},
				riddles: {
		            id: "riddles",
					initial: "prompt",
					on: {
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
						prompt: {
							entry: say("Here is your riddle"),
							on: {
								ENDSPEECH: {
									target: "ask_riddle",
									actions: assign((context) => {
										return { riddle_id: Math.floor(Math.random() * 7) }
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
		            id: "chimp_test",
					initial: "prompt",
					on: {
						RECOGNISED: [
							{
								target: '.correct_sequence',
								actions: assign((context)=>{
									context.sequence.push(Math.floor(Math.random() * 9))
									return { one_try_given: false }
								}),
								cond: context => math_operator_store.parse_asr_numbers(context.recResult) === context.sequence.join('')
							},
							{ 
								target: ".wrong_sequence" ,
								cond: (context) => !commands.includes(context.recResult)
							}
						]
					},
					states: {
						prompt: {
							entry: say("This is the chimp test. I will say an ever increasing sequence of numbers which you need to repeat back to me. If you can't recall a sequence you lose. Try to get the highest score!"),
							on: {
								ENDSPEECH: {
									target: 'say_sequence',
									actions: assign( (context)=> {
										return { sequence: [Math.floor(Math.random() * 9),] }
									})
								}
							},
						},
						say_sequence: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `The sequence is ${context.sequence.join(' ')}. Repeat that back`
		                    })),
		                    on: { ENDSPEECH: 'ask' }
						},
						correct_sequence: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `Good job! You have ${context.sequence.length-1} points`
		                    })),
							on: { ENDSPEECH: "say_sequence" }
						},
						wrong_sequence: {
							entry: say('That is incorrect. '),
							on: { 
								ENDSPEECH: [ 
									{
										target: 'say_sequence',
										cond: context => {return !(context.one_try_given || false)},
										actions: [
											assign((context)=>{return { one_try_given: true } }),
											say("I will give you one more chance to get that right or you lose.")
										]
									},
									{
										actions: send((context) => ({
					                        type: "SPEAK",
					                        value: `You ended with ${context.sequence.length-1} points`
					                    })),
										target: '#init',
									}
								]
							}
						},
						ask: {
			                entry: [
								send('LISTEN'),
								send( 'MAXSPEECH', { delay: context=>(4000+1000*context.sequence.length), id: 'maxspeech_cancel' } ),
							],
			            },
					}
				},
				please_repeat: {
		            id: "please_repeat",
					initial: "prompt",
					states: {
						prompt: {
							entry: say("Sorry, I didn't get that. ")
						},
					},
					on: { ENDSPEECH: "#init" }
				},
		    },
		},
		maxspeech: {
			initial: 'apologies',
			on: {
				ENDSPEECH: [
					{
						target: '#init.main.hist',
						cond: (function() { return maxspeech_count_local < 2 } ),
						actions: [
							(function() { maxspeech_count_local ++ } ),
							assign(context=>{context})
						]
					},
					{
						target: '#init',
						actions: [
							(function() { maxspeech_count_local = 0 } ),
							say("and you haven't responded in a while. Resetting."),
							assign(context=>{context})
						]
					},
				]
			},
			states: {
				apologies: {
					entry: say("Sorry, I couldn't hear you. ")
				},
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
