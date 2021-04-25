

const biomes = [
	{
		name: 'arctic',
		fq: 0.3,
		density: 0.002,
		terrains: [
			{
				name: 'snow',
				colour: '#BFC7D6',
				friction: 2,
				fq: 0.5,
				grip: 1
			},
			{
				name: 'ice', 
				colour: '#3E5576',
				friction: 0.01,
				fq: 0.5,
				grip: 0.01
			}
		]
	},
	{
		name: 'ocean',
		fq: 0.1,
		density: 1,
		terrains: [
			{
				name: 'water',
				colour: '#1D4DBB',
				fq: 1,
				friction: 1.2,
				grip: 0.6
			}
		]
	},
	{
		name: 'beach',
		fq: 0.03,
		density: 0.001,
		terrains: [
			{
				name: 'sand',
				colour: '#E6E656',
				fq: 0.5,
				friction: 0.8,
				grip: 1
			},
			{
				name: 'pebble',
				colour: '#DADBCA',
				fq: 0.5,
				friction: 1,
				grip: 0.7
			}
		]
	},
	{
		name: 'normal',
		fq: 0.6,
		density: 0.002,
		terrains: [
			{
				name: 'grass',
				colour: '#1B9E40',
				friction: 0.3,
				fq: 0.62,
				grip: 1
			},
			{
				name: 'long grass',
				colour: '#0D8613',
				friction: 0.5,
				fq: 0.18,
				grip: 1
			},
		],
		objects: [
			{
				name: 'wood',
				colour: '#734C11',
				z: 200,
			},
			{
				name: 'rock',
				colour: '#B6B6B6',
				z: 666,
			}
		]
	}
]

const bioDensity = 0.0002

function getBiome (x, y) {
	const bioNo = noise((x)*bioDensity, (y)*bioDensity);
	cf = 0;
	for (b of biomes) {
		cf += b.fq;
		if (bioNo < cf) {
			return b;
		}
	}
	return biomes[0];
}

function getTerrain(x, y) {
	let bio = getBiome(x, y);
	let area = `${round(x/30)},${round(y/30)}`
	const terrNo = noise((x)*bio.density, (y)*bio.density)
	- (dig[area] || 0);
	cf = 0;
	for (b of bio.terrains) {
		cf += b.fq;
		if (terrNo < cf) {
			return b;
		}
	}
	let num = 0;
	let object = bio.objects[0];
	for (o of bio.objects) {
		objectV = noise((x)*bio.density, (y)*bio.density, o.z) 
		if (objectV > num){
			num = objectV;
			object = o;
		}
	}
	return Object.assign({friction: 10, grip: 1, object: true}, object);
}


