// Creates colored sphere with a "category" as parent
function createDebugSphere(position, color, category, internalList) {
    /*
    var material = new THREE.MeshBasicMaterial( { color: color } );
    var mesh = new THREE.Mesh( debugGeometry, material );
    mesh.position.copy( position );
    debugCategories[category].add(mesh);
    internalList.push(mesh);
    return mesh;
    */
}

function pregenerateHexGeometry(hexes, regenerate=false) {
    
    var neighbours = new Set(hexes);
    for (h of hexes) {
        for (n of h.neighbours)
            neighbours.add(n);
    }
    
    var second_neighbours = new Set(neighbours);
    for (h of Array.from(neighbours)) {
        for (n of h.neighbours)
            second_neighbours.add(n);
    }
    
    var newEdges = generateHexEdges(Array.from(second_neighbours), regenerate);
    
    generateHexTriplets(Array.from(neighbours), regenerate);
    
    finishEdges(newEdges);
}

// DELETION

function destroyPregeneratedHexGeometry(hexes) {
    for (hex of hexes) {
        removePregeneratedGeometry(hex);
    }
}

function removePregeneratedGeometry(hex) {
    for (var i = 0; i < hex.neighbours.length; i++) {
        var j = (i+1) % hex.neighbours.length;
        
        deleteEdge(hex, hex.neighbours[i]);
        deleteTriplet(hex, hex.neighbours[i], hex.neighbours[j]);
    }
}

// TRIPLET FUNCTIONS
//
//

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
        triplets[a].push(n);
        generate.add(n);
        return n;
    } else
        throw new Error("Triplet " + [a,b,c] + " not found.")
}

function deleteTriplet(a,b,c) {
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
    
    if (triplets[a]) {
        for (var i = 0; i < triplets[a].length; i++) {
            var p = triplets[a][i];
            if (p.b == b && p.c == c) {
                triplets[a].splice(i, 1);
                i -= 1;
            }
        }
    }
}

function generateHexTriplets(hexes, regenerate = false) {
    regennedSet = new Set();
    
    for (hex of hexes) {
        while (triplets.length < hex.id+1)
            triplets.push([]);
        
        var j = 0;
        for (var i = 0; i < hex.neighbours.length; i++) {
            j = (i+1) % hex.neighbours.length;

            tri = getTriplet(hex, hex.neighbours[i], hex.neighbours[j], generate=regennedSet);
            
            if (regenerate && !regennedSet.has(tri)) {
                generateTriplet(hex, hex.neighbours[i], hex.neighbours[j], regenerate=tri);
                regennedSet.add(tri);
            }
        }
    }
}

function generateTriplet(a,b,c, regenerate=false) {
    var triplet = {a:a.id,b:b.id,c:c.id,  spheres:[]};

    if (regenerate)
        triplet = regenerate;
    
    for (sphere of triplet.spheres) {
        sphere.material.dispose();
        sphere.parent.remove(sphere);
    }
    triplet.spheres = [];

    triplet.position =  a.centre.clone().add(b.centre).add(c.centre).divideScalar(3);
    
    triplet.triple_cliff = false;

    var ab = getEdge(a,b);
    var bc = getEdge(c,b);
    var ac = getEdge(c,a);

    if (!ab.triplets.includes(triplet))
        ab.triplets.push(triplet);
    if (!bc.triplets.includes(triplet))
        bc.triplets.push(triplet);
    if (!ac.triplets.includes(triplet))
        ac.triplets.push(triplet);

    var vertices = {}

    if (ab.cliff & bc.cliff & ac.cliff) {
        triplet.a_pos = triplet.position.clone().setComponent(1, a.centre.y);
        triplet.b_pos = triplet.position.clone().setComponent(1, b.centre.y);
        triplet.c_pos = triplet.position.clone().setComponent(1, c.centre.y);

        var upper = Math.max(a.centre.y+b.centre.y, b.centre.y+c.centre.y, a.centre.y+c.centre.y)/2;
        var lower = Math.min(a.centre.y+b.centre.y, b.centre.y+c.centre.y, a.centre.y+c.centre.y)/2;

        triplet.upper_mid = triplet.position.clone().setComponent(1, upper);
        triplet.lower_mid = triplet.position.clone().setComponent(1, lower);

        triplet.mid = triplet.lower_mid;

        vertices[a.id] = triplet.a_pos;
        vertices[b.id] = triplet.b_pos;
        vertices[c.id] = triplet.c_pos;

        triplet.triple_cliff = true;

        triplet.vertArr = [triplet.a_pos, triplet.b_pos, triplet.c_pos, triplet.upper_mid, triplet.lower_mid];

        createDebugSphere(triplet.a_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.b_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.c_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        
        createDebugSphere(triplet.upper_mid, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.lower_mid, 0xff0000, "cliffTriplets", triplet.spheres);
    } else if (ab.cliff & bc.cliff) {
        triplet.a_pos = triplet.position.clone().setComponent(1, (a.centre.y+c.centre.y)/2 );
        triplet.b_pos = triplet.position.clone().setComponent(1, b.centre.y);
        triplet.c_pos = triplet.a_pos;

        triplet.mid = triplet.a_pos.clone().add(triplet.b_pos).divideScalar(2);

        vertices[a.id] = triplet.a_pos;
        vertices[b.id] = triplet.b_pos;
        vertices[c.id] = triplet.c_pos;

        triplet.vertArr = [triplet.a_pos, triplet.b_pos, triplet.mid];

        createDebugSphere(triplet.a_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.b_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.mid, 0xff0000, "cliffTriplets", triplet.spheres);
    } else if (ab.cliff & ac.cliff) {
        triplet.a_pos = triplet.position.clone().setComponent(1, a.centre.y);
        triplet.b_pos = triplet.position.clone().setComponent(1, (b.centre.y+c.centre.y)/2 );
        triplet.c_pos = triplet.b_pos;

        triplet.mid = triplet.a_pos.clone().add(triplet.b_pos).divideScalar(2);

        vertices[a.id] = triplet.a_pos;
        vertices[b.id] = triplet.b_pos;
        vertices[c.id] = triplet.c_pos;

        triplet.vertArr = [triplet.a_pos, triplet.b_pos, triplet.mid];

        createDebugSphere(triplet.a_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.b_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.mid, 0xff0000, "cliffTriplets", triplet.spheres);
    } else if (bc.cliff & ac.cliff) {
        triplet.a_pos = triplet.position.clone().setComponent(1, (a.centre.y+b.centre.y)/2 );
        triplet.b_pos = triplet.a_pos;
        triplet.c_pos = triplet.position.clone().setComponent(1, c.centre.y);

        triplet.mid = triplet.a_pos.clone().add(triplet.c_pos).divideScalar(2);

        vertices[a.id] = triplet.a_pos;
        vertices[b.id] = triplet.b_pos;
        vertices[c.id] = triplet.c_pos;

        triplet.vertArr = [triplet.a_pos, triplet.c_pos, triplet.mid];

        createDebugSphere(triplet.a_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.c_pos, 0xff0000, "cliffTriplets", triplet.spheres);
        createDebugSphere(triplet.mid, 0xff0000, "cliffTriplets", triplet.spheres);
    } else {
        triplet.a_pos = triplet.position;
        triplet.b_pos = triplet.position;
        triplet.c_pos = triplet.position;
        triplet.mid = triplet.position;

        vertices[a.id] = triplet.a_pos;
        vertices[b.id] = triplet.b_pos;
        vertices[c.id] = triplet.c_pos;

        triplet.vertArr = [triplet.position];

        createDebugSphere(triplet.position, 0xffff00, "regularTriplets", triplet.spheres);
    }

    triplet.vertices = vertices;

    return triplet;
}

// EDGE FUNCTIONS
//
//

function getEdge(a,b, generate = false) {
    if (a.isHex)
        a = a.id;
    if (b.isHex)
        b = b.id;

    if (a > b) {
        a = b + (b=a, 0)
    }
    
    if (!edges[a])
        throw new Error("Edge " + [a,b] + " not found.")

    for (p of edges[a]) {
        if (p.b == b) {
            return p;
        }
    }
    if (generate) {
        var e = generateEdge(hexArray[a],hexArray[b]);
        edges[a].push(e);
        generate.add(e);
        return e;
    } else
        throw new Error("Edge " + [a,b] + " not found.")
}

function deleteEdge(a,b) {
    if (a.isHex)
        a = a.id;
    if (b.isHex)
        b = b.id;

    if (a > b) {
        a = b + (b=a, 0)
    }
    
    if (edges[a]) {
        for (var i = 0; i < edges[a].length; i++) {
            var p = edges[a][i];
            if (p.b == b) {
                edges[a].splice(i,1);
                i--;
            }
        }
    }
}

function generateHexEdges(hexes, regenerate = false) {
    var regennedSet = new Set();
    
    for (hex of hexes) {
        while (edges.length < hex.id+1)
            edges.push([]);
        
        for (n of hex.neighbours) {
            var e = getEdge(hex, n, generate=regennedSet);
            
            if (regenerate && !regennedSet.has(e)) {
                generateEdge(hex, n, regenerate=e);
                e.isRaw = true;
            }
            regennedSet.add(e);
        }
    }
    
    return regennedSet;
}

function generateEdge(a,b, regenerate=false) {
    var edge = {a:a.id, b:b.id, triplets:[], spheres:[], isRaw:true};
    
    if (regenerate)
        edge = regenerate;
    
    for (sphere of edge.spheres) {
        sphere.material.dispose();
        sphere.parent.remove(sphere);
    }
    edge.spheres = [];

    var flag = true;
    //for (var i = 0; i < a.neighboursData.length; i++)
    for (d of a.neighboursData) {
        if (d.hex == b) {
            edge.cliff = d.cliff;
            edge.singleCliff = d.singleCliff;
            flag = false;
            break;
        }
    }
    for (d of b.neighboursData) {
        if (d.hex == a) {
            edge.cliff = edge.cliff && d.cliff;
            edge.singleCliff = edge.singleCliff && d.singleCliff;
            flag = false;
            break;
        }
    }
    
    if (edge.singleCliff)
        edge.cliff = false;
    
    if (flag) {
        console.log(a, b)
        throw new Error("Edge not found in neighboursData");
    }

    return edge;
}

function finishEdges(edges) {
    for (edge of edges) {
        if (!edge.isRaw)
            continue;
        
        if (edge.triplets.length < 2)
            continue;
        
        var a = hexArray[edge.a];
        var b = hexArray[edge.b];

        edge.position = edge.triplets[0].vertices[a.id].clone().add(edge.triplets[1].vertices[a.id]).divideScalar(2);

        edge.vertices = {}
        edge.vertArr = [];
        if (edge.cliff) {
            edge.vertices[a.id] = edge.position.clone().setComponent(1, a.centre.y );
            edge.vertices[b.id] = edge.position.clone().setComponent(1, b.centre.y );

            edge.mid = edge.position.clone().setComponent(1, (a.centre.y+b.centre.y)/2 );

            edge.vertArr.push(edge.vertices[a.id], edge.vertices[b.id], edge.mid);

            createDebugSphere(edge.vertices[a.id], 0x0000ff, "cliffEdges", edge.spheres);
            createDebugSphere(edge.vertices[b.id], 0x0000ff, "cliffEdges", edge.spheres);
            createDebugSphere(edge.mid, 0x0000ff, "cliffEdges", edge.spheres);
        } else {
            edge.vertices[a.id] = edge.position;
            edge.vertices[b.id] = edge.position;
            edge.mid = edge.position;

            edge.vertArr.push(edge.position);

            createDebugSphere(edge.position, 0x00ffff, "regularEdges", edge.spheres);
        }
        
        edge.isRaw = false;
    }
}