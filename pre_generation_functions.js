// Creates colored sphere with a "category" as parent
function createDebugSphere(position, color, category) {
    var material = new THREE.MeshBasicMaterial( { color: color } );
    var mesh = new THREE.Mesh( debugGeometry, material );
    mesh.position.copy( position );
    debugCategories[category].add(mesh)
    return mesh;
}

function getTriplet(a,b,c, generate=false) {
    if (a.isHex)
        a = a.id;
    if (b.isHex)
        b = b.id;
    if (c.isHex)
        c = c.id;

    // order id's
    if (a > b) {
        a = b + (b=a, 0)
    }
    if (b > c) {
        c = b + (b=c, 0)

        if (a > b) {
            a = b + (b=a, 0)
        }
    }

    for (p of triplets[a]) {
        if (p.b == b && p.c == c) {
            return p;
        }
    }
    if (generate) {
        var n = generateTriplet(hexArray[a],hexArray[b],hexArray[c]);
        triplets[a].push(n)
        return n;
    } else
        throw new Error("Triplet " + [a,b,c] + " not found.")
}

function generateTriplets() {
    for (var i = 0; i < latestID; i++) {
        triplets.push([])
    }

    for (hex of hexArray) {
        if (!hex.active)
            continue;

        generateHexTriplets(hex);
    }
}

function generateHexTriplets(hex) {
    var j = 0;
    for (var i = 0; i < hex.neighbours.length; i++) {
        j = (i+1) % hex.neighbours.length;

        tri = getTriplet(hex, hex.neighbours[i], hex.neighbours[j], generate=true)
    }
}