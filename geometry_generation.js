// returns BufferedGeometry. Uses global list of edges and triplets
function createTerrainGeometry(drawnHexes) {
    var geometry = new THREE.BufferGeometry();
    
    // Find all neighbouring hexes not already selected.
    // Will not be rendered but necessary to combine different chunks
    var undrawnHexes = [];
    for (hex of drawnHexes) {
        for (n_hex of hex.neighbours) {
            if (drawnHexes.includes(n_hex))
                continue;
            if (undrawnHexes.includes(n_hex))
                continue;
            
            undrawnHexes.push(n_hex);
        }
    }
    allHexes = [].concat(drawnHexes, undrawnHexes.filter(h => h.active));
    
    
    // Create faces
    // Vertices will be added to geometry based on vertices
    var faces = []; // List of vertices of THREE.Vector3
    var counter = 0;
    for (hex of allHexes) {
        // Collect surrounding triplets
        var tri = [];
        for (var i  = 0; i < hex.neighbours.length; i++) {
            var j = (i+1) % hex.neighbours.length;
            triplet = getTriplet(hex, hex.neighbours[i], hex.neighbours[j]);
            tri.push(triplet.vertices[hex.id]);
        }

        // Collect surrounding edges
        var edge = [];
        for (n of hex.neighbours) {
            var n_e = getEdge(hex, n);
            edge.push(n_e.vertices[hex.id]);
        }


        // Generate extra internal vertices
        var internal_edge = [];
        for (var i = 0; i < tri.length; i++) {
            var j = (i+1) % tri.length;

            var dir = hex.centre.clone().sub(edge[i]).normalize().multiplyScalar(-0.25);
            internal_edge.push(edge[i].clone().sub(dir));
        }
        
        var internal_tri = [];
        for (var i = 0; i < tri.length; i++) {
            var j = (i+1) % tri.length;
            var dir = hex.centre.clone().sub(tri[i]).normalize().multiplyScalar(-0.25);
            internal_tri.push(tri[i].clone().sub(dir));
        }

        // Add hex faces
        for (var i = 0; i < tri.length; i++) {
            var j = (i+1) % tri.length;

            faces.push(hex.centre, internal_tri[i], internal_edge[i]);
            faces.push(hex.centre, internal_edge[j], internal_tri[i]);
            
            faces.push(internal_edge[j], tri[i], internal_tri[i]);
            faces.push(internal_edge[j], edge[j], tri[i]);
            faces.push(internal_tri[i], tri[i], edge[i]);
            faces.push(internal_tri[i], edge[i], internal_edge[i]);
            

        }
        
        // Create cliff faces as neccessary
        // Facing towards camera, simplest cliff example:
        // c - a     - associated with hex
        // |   |
        // d - b     - associated with opposing hex
        // edge pointing towards j    i->j->k (clockwise)
        for (var i  = 0; i < hex.neighbours.length; i++) {
            var j = (i+1) % hex.neighbours.length;
            var k = (i+2) % hex.neighbours.length;

            var triplet1 = getTriplet(hex, hex.neighbours[i], hex.neighbours[j]);

            var n_e = getEdge(hex, hex.neighbours[j]);

            var triplet2 = getTriplet(hex, hex.neighbours[j], hex.neighbours[k]);

            // FIRST SIDE
            if (!triplet1.triple_cliff | triplet1.vertices[hex.id].y < triplet1.vertices[hex.neighbours[i].id].y) {
                var a = triplet1.vertices[hex.id];
                var b = triplet1.vertices[hex.neighbours[j].id];
                var c = n_e.vertices[hex.id];
                var d = n_e.vertices[hex.neighbours[j].id];

                var m1 = triplet1.mid;
                var m2 = n_e.mid;

                if (a.y > b.y & c.y > d.y) {
                    faces.push(a, m2, m1);
                    faces.push(a, c, m2);
                    faces.push(m1, d, b);
                    faces.push(m1, m2, d);
                } else if (a.y > b.y & c.y == d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }  else if (a.y == b.y & c.y > d.y) {
                    faces.push(a, c, m2);
                    faces.push(a, m2, d);
                } else if (a.y < b.y & c.y > d.y) {
                    faces.push(a, m2, d);
                    faces.push(a, c, m2);
                } else if (a.y > b.y & c.y < d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }
            } else if (triplet1.vertices[hex.neighbours[j].id].y > triplet1.vertices[hex.neighbours[i].id].y) {

                var a = triplet1.vertices[hex.id];
                var b = triplet1.vertices[hex.neighbours[j].id];
                var c = n_e.vertices[hex.id];
                var d = n_e.vertices[hex.neighbours[j].id];

                var m1 = triplet1.upper_mid;
                var m2 = n_e.mid;

                if (a.y > b.y & c.y > d.y) {
                    faces.push(a, m2, m1);
                    faces.push(a, c, m2);
                    faces.push(m1, d, b);
                    faces.push(m1, m2, d);
                } else if (a.y > b.y & c.y == d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }  else if (a.y == b.y & c.y > d.y) {
                    faces.push(a, c, m2);
                    faces.push(a, m2, d);
                } else if (a.y < b.y & c.y > d.y) {
                    faces.push(a, m2, d);
                    faces.push(a, c, m2);
                } else if (a.y > b.y & c.y < d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }
            } else {
                var a = triplet1.vertices[hex.id];
                var b = triplet1.vertices[hex.neighbours[j].id];
                var a_b = triplet1.vertices[hex.neighbours[i].id];
                var c = n_e.vertices[hex.id];
                var d = n_e.vertices[hex.neighbours[j].id];

                var u_m = triplet1.upper_mid;
                var l_m = triplet1.lower_mid;

                var m2 = n_e.mid;

                faces.push(a, c, u_m);
                faces.push(u_m, c, m2);
                faces.push(u_m, m2, a_b);
                faces.push(a_b, m2, l_m);
                faces.push(l_m, m2, d);
                faces.push(l_m, d, b);
            }
            // SECOND SIDE
            if (!triplet2.triple_cliff | triplet2.vertices[hex.id].y < triplet2.vertices[hex.neighbours[k].id].y) {
                var a = n_e.vertices[hex.id];
                var b = n_e.vertices[hex.neighbours[j].id];
                var c = triplet2.vertices[hex.id];
                var d = triplet2.vertices[hex.neighbours[j].id];

                var m1 = n_e.mid;
                var m2 = triplet2.mid;

                if (a.y > b.y & c.y > d.y) {
                    faces.push(a, m2, m1);
                    faces.push(a, c, m2);
                    faces.push(m1, d, b);
                    faces.push(m1, m2, d);
                } else if (a.y > b.y & c.y == d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }  else if (a.y == b.y & c.y > d.y) {
                    faces.push(a, c, m2);
                    faces.push(a, m2, d);
                } else if (a.y < b.y & c.y > d.y) {
                    faces.push(a, m2, d);
                    faces.push(a, c, m2);
                } else if (a.y > b.y & c.y < d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }
            } else if (triplet2.vertices[hex.neighbours[j].id].y > triplet2.vertices[hex.neighbours[k].id].y) {
                var a = n_e.vertices[hex.id];
                var b = n_e.vertices[hex.neighbours[j].id];
                var c = triplet2.vertices[hex.id];
                var d = triplet2.vertices[hex.neighbours[j].id];

                var m1 = n_e.mid;
                var m2 = triplet2.upper_mid;

                if (a.y > b.y & c.y > d.y) {
                    faces.push(a, m2, m1);
                    faces.push(a, c, m2);
                    faces.push(m1, d, b);
                    faces.push(m1, m2, d);
                } else if (a.y > b.y & c.y == d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }  else if (a.y == b.y & c.y > d.y) {
                    faces.push(a, c, m2);
                    faces.push(a, m2, d);
                } else if (a.y < b.y & c.y > d.y) {
                    faces.push(a, m2, d);
                    faces.push(a, c, m2);
                } else if (a.y > b.y & c.y < d.y) {
                    faces.push(c, m1, a);
                    faces.push(c, b, m1);
                }
            } else {
                var a = n_e.vertices[hex.id];
                var b = n_e.vertices[hex.neighbours[j].id];
                var c = triplet2.vertices[hex.id];
                var d = triplet2.vertices[hex.neighbours[j].id];
                var c_d = triplet2.vertices[hex.neighbours[k].id];

                var u_m = triplet2.upper_mid;
                var l_m = triplet2.lower_mid;

                var m1 = n_e.mid;

                faces.push(a, c, u_m);
                faces.push(a, u_m, m1);
                faces.push(m1, u_m, c_d);
                faces.push(m1, c_d, l_m);
                faces.push(m1, l_m, b);
                faces.push(b, l_m, d);
            }
        }
        
        counter += 1;
        
        // Stops hidden hexes from rendering, they don't have correct normals
        if (counter == drawnHexes.length)
            geometry.setDrawRange(0, faces.length);
    }
    
    // Process list of faces to generate list of unique vertices used
    // and create list of vertex indices for all faces
    var indexMap = new Map();
    var vertices = [];
    
    faceArray = faces.map(vertex => {
        if (indexMap.has(vertex))
            return indexMap.get(vertex);
        
        var index = vertices.length;
        vertices.push(vertex);
        indexMap.set(vertex, index);
        
        return index;
    });

    geometry.setIndex( faceArray );

    // Convert to typed array of floats
    var vertexArray = [];
    for (vertex of vertices) {
        vertexArray.push(vertex.x, vertex.y, vertex.z);
    }
    vertexArray = new Float32Array(vertexArray);

    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertexArray, 3 ) );

    return geometry;
}