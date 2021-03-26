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
	"number sequence game": { chimp_test: null },
	"the number sequence game": { chimp_test: null },
	
	
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
			//~ case 'divide':
				//~ return a/b
			}
		},
	generate_number: function(operator){
		switch(operator){
			case 'plus': 
				return Math.floor(Math.random() * 100)
			case 'subtract': 
				return Math.floor(Math.random() * 100)
			case 'times': 
				return Math.floor(Math.random() * 12)
			//~ case 'divide': //division can be a bit hard on the spot for a user
				//~ return a/b
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
					send( 'MAXSPEECH', { delay: 6000, id: 'maxspeech_cancel' } )
				]
            },
        }
    })
}

const proxyurl = "https://cors-anywhere.herokuapp.com/" //"https://boiling-depths-26621.herokuapp.com/" alternate url
const rasaurl = 'https://herokufinalproj.herokuapp.com/model/parse'


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
						MAX_HTTP: {
							target: '#init',
							actions: say('The RASA server is taking too long to respond. Please wait and try again. ')
						},
						NLU_REQ_DONE: [
							{
			                    cond: (context) => context.snippet === "chimp_test",
			                    target: "chimp_test",
							},
							{
								target: "quick_math",
								cond: (context, event) => context.snippet === "quick_math",
							},
							{
								target: "riddles",
								cond: (context) => context.snippet === "riddles",
							},
							{
								target: ".re_prompt",
							},
							
						],
						RECOGNISED: '.nlu_process',
						MAXSPEECH: '.too_long',
					},
					states: {
						prompt: {
							...promptAndAsk("Hello! You have a selection of one of the following mini games. You can choose between quick maths, riddles or the number memory test. You can also tell me to stop or ask for help at any time. ")
						},
						nlu_process: {
							initial: 'http_timer',
							invoke: {
								id: "rasaquery",
								src: (context, event) => {
									
									return fetch(new Request(proxyurl + rasaurl, {
							        method: 'POST',
							        headers: { 'Origin': 'http://localhost:3000/' }, // only required with proxy
							        body: `{"text": "${context.recResult}"}`
									}))
							        .then(data => data.json());
					
								},
								onDone: 'completed_query',
								onError: {
										target: '#init',
										actions: say("Sorry, there was an error. ")
								},
							},
							states: {
								http_timer: {
									entry: send( 'MAX_HTTP', { delay: 12000, id: 'maxspeech_cancel' } )
								},
							},
						},
						re_prompt: {
							entry: say("Sorry, I didn't quite get that. Repeat yoself!"),
							on: { ENDSPEECH: 'ask' }
						},
						ask: {
			                entry: [
								send('LISTEN'),
								send( 'MAXSPEECH', { delay: 7000, id: 'maxspeech_cancel' } )
							],
			            },
						completed_query: {
							entry: [
								assign((context, event)=>{
									console.log(event.data.intent.name)
									return { snippet: ( event.data.intent.name || 'unconfident_resp' ) }
								}),
								send("NLU_REQ_DONE")
							]
						},
						too_long:{
							entry: say('Still there?'),
							on: { 
								ENDSPEECH: [
									{
										target: '#init',
										cond: (context) => context.maxspeech_counter > 2,
										actions: say("As you haven't responded; resetting...")
									},
									{
										target: 'ask',
										actions: assign(context=>{ return { maxspeech_counter: (context.maxspeech_counter || 0)+1 } })
									},
								]
							}
						},
		            }
				},
				quick_math: {
		            id: "quick_math",
					initial: "generate_math_question",
					on: {
						MAXSPEECH: '.too_long',
						RECOGNISED: [
							{
								target: '.right_answer',
								cond: (context) => context.recResult === context.solution.toString(),
								actions: assign((context)=>{ return { 
									points: (context.points || 0)+1 ,
									wrong_math : 0
								} })
							},
							{
								target: ".wrong_answer",
								cond: (context) => !commands.includes(context.recResult)
							},
							
						]
					},
					states: {
						generate_math_question: {
							entry: say("Here is your maths question"),
							on: {
								ENDSPEECH: {
									target: "ask_math_question",
									actions: assign((context) => {
										var operator_id = Math.floor(Math.random() * 3)
										var operator = math_operator_store[operator_id].operator
										return { 
											number_one: math_operator_store.generate_number(operator),
											number_two: math_operator_store.generate_number(operator),
											operator_id: operator_id,
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
							entry: say("Sorry, that's wrong!"),
							on: { ENDSPEECH:  [
									{
										target: 'try_again',
										actions: assign(context=>{ return { wrong_math: (context.wrong_math || 0) +1 } }),
										cond: context=> (context.wrong_math || 0) < 2,
									},
									{
										target: '#init',
										actions: say("... and you've gotten it wrong a couple of times now! Resetting..."),
									},
								]
							},
						},
						right_answer: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `Nice, that's right. You have ${context.points} ${( (context.points === 1)? 'point' : 'points')}.`
		                    })),
							on: { 
								ENDSPEECH: {
									target: "generate_math_question",
								}
							}
						},
						too_long:{
							entry: say('Still there?'),
							on: { 
								ENDSPEECH: [
									{
										target: '#init',
										cond: (context) => context.maxspeech_counter > 2,
										actions: [
											assign((context=>{ return { maxspeech_counter: 0 } })),
											say("As you haven't responded; resetting...")
										]
									},
									{
										target: 'ask',
										actions: assign(context=>{ return { maxspeech_counter: (context.maxspeech_counter || 0)+1 } })
									},
								]
							}
						},
						try_again:{
							entry: say("Try again."),
							on: {
								ENDSPEECH: 'ask'
							},
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
						MAXSPEECH: '.too_long',
						RECOGNISED: [
							{
								cond: context => riddles_store[context.riddle_id].answers.includes(context.recResult),
								actions: [
									assign(context=>{ return { wrong_riddle: 0 } })
								],
								target: '.another_riddle',
							},
							{
								cond: context => ((context.recResult == 'hint') || (context.recResult == 'hint please')),
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
							entry: say("Guess the answer to the riddle. Don't be afraid to ask for a hint. Here is your riddle: "),
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
		                        value: `The hint is:\n ${riddles_store[context.riddle_id].hint} Now tell me...`
		                    })),
		                    on: { ENDSPEECH: "ask" }
						},
						ask_riddle: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `${riddles_store[context.riddle_id].riddle}`
		                    })),
		                    on: { ENDSPEECH: "ask" }
						},
						too_long:{
							entry: say('Hello?'),
							on: { 
								ENDSPEECH: [
									{
										target: '#init',
										actions: say("As you haven't responded, resetting..."),
										cond: context=> context.maxspeech_counter >1,
									},
									{
										target: 'ask',
										actions: [
											assign(context=>{ return { maxspeech_counter: (context.maxspeech_counter || 0) +1 } }),
										]
									},
								]
							},
						},
						wrong_answer: {
							entry: say("Sorry, that's wrong!"),
							on: { ENDSPEECH:  [
									{
										target: 'try_again',
										actions: assign(context=>{ return { wrong_riddle: (context.wrong_riddle || 0) +1 } }),
										cond: context=> (context.wrong_riddle || 0) < 2,
									},
									{
										target: '#init',
										actions: say("You've gotten it wrong a couple of times now! Resetting..."),
									},
								]
							},
						},
						try_again:{
							entry: say("Try again."),
							on: {
								ENDSPEECH: 'ask'
							},
						},
						another_riddle: {
							initial: 'ask',
							on: {
								ENDSPEECH: '.ask',
								RECOGNISED: [
									{
										target: 'prompt',
										actions: assign((context) => {
											return { riddle_id: Math.floor(Math.random() * 7) }
										}),
										cond: context=> (context.recResult || "invalid") == "yes",
									},
									{
										target: '#init',
										actions: say("Ok, resetting."),
									},
								]
							},
							states: {
								ask: {
									entry: say("Well done, that is correct! Would you like another riddle?"),
									on: {
										ENDSPEECH: 'listen'
									}
								},
								listen: {
									entry: [
										send('LISTEN'),
										send( 'MAXSPEECH', { delay: 15000, id: 'maxspeech_cancel' } )
									],
								},
							}
						},
						ask: {
			                entry: [
								send('LISTEN'),
								send( 'MAXSPEECH', { delay: 15000, id: 'maxspeech_cancel' } )
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
						],
						MAXSPEECH: '.too_long'
					},
					states: {
						prompt: {
							entry: say("This is the number memory test. I will say an ever increasing sequence of numbers which you need to repeat back to me. If you can't recall a sequence you lose. Try to get the highest score!"),
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
		                        value: `The ${( (context.sequence.length === 1)? 'first' : 'next')} number is ${context.sequence[context.sequence.length-1]}. Repeat back the sequence`
		                    })),
		                    on: { ENDSPEECH: 'ask' }
						},
						correct_sequence: {
							entry: send((context) => ({
		                        type: "SPEAK",
		                        value: `Good job! You have ${context.sequence.length-1} ${( ( (context.sequence.length-1) === 1)? 'point' : 'points')}.`
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
						too_long:{
							entry: say('Hello?'),
							on: { 
								ENDSPEECH: [
									{
										target: '#init',
										actions: say("As you haven't responded, resetting..."),
										cond: context=> context.maxspeech_counter >1,
									},
									{
										target: 'ask',
										actions: [
											assign(context=>{ return { maxspeech_counter: (context.maxspeech_counter || 0) +1 } }),
										]
									},
								]
							},
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
			entry: say("Here is a help message, but you made the game, so you shouldn't need one. Going back to the game..."),
			on: {
				ENDSPEECH: {
					target: 'main.hist'
				},
			},
		},
	},
})
