multiCharMap = {}
multiCharMapRev = {}
multiChars = []
diacritics = ["329","30D","32F","311","31a","325","30a","32c","324","330","32a","346","33c","33a","33b","31f",
    "320","308","33d","31d","31e","339","31c","357","351","334","318","319","303","2de","2b0","207F","2e1","1DBF",
    "2e3","1d4a","2b1","3a","2d0","2b7","2b2","2e0"]


function analyze(){
    allophones = Array.from(new Set(document.getElementById("allophones").value.split(" "))).sort()
    words = Array.from(new Set(document.getElementById("words").value.split(" "))).sort()

    addMultiChars(allophones.concat(words))
    words = remapMultiChars(words)

    minPairs = getMinPairs(allophones, words)
    document.getElementById("minPairChartContainer").innerHTML = ""
    Object.entries(minPairs).forEach(e => addMinPairChart(e[0],e[1]))

    dists = getDistributions(allophones, words)
    document.getElementById("distChartContainer").innerHTML = ""
    addDistributionChart(dists)
}

//find the sounds consisting of multiple characters (diacritics, affricates) and add them to the map
function addMultiChars(soundsList){
    for(i=0;i<soundsList.length;i++){
        sounds = soundsList[i]
        if(sounds.length == 1){
            continue
        }
        for(j=0;j<sounds.length-1;j++){
            cur = sounds[j]
            next = sounds[j+1]
            nextHex = sounds.charCodeAt(j+1).toString(16)
            if(diacritics.includes(nextHex)){
                multiChars.push(cur+next)
                j++
            }else if(nextHex == "361" || nextHex == "35C"){ //tie bars
                multiChars.push(cur+next+sounds[j+2])
                j+=2
            }
        }
    }
    multiChars = Array.from(new Set(multiChars))
}

//split an array of words into an array of arrays of sounds, splitting by character but combining sounds with >1 characters
function remapMultiChars(words){
    words = words.map((w) => w.split(""))
    for(i=0;i<words.length;i++){
        word = words[i]
        for(j=0;j<word.length;j++){
            if(multiChars.includes(word[j]+word[j+1])){
                word[j] = word[j] + word[j+1]
                word.splice(j+1,1)
            }else if(multiChars.includes(word[j]+word[j+1]+word[j+2])){
                word[j] = word[j] + word[j+1] + word[j+2]
                word.splice(j+1,2)
            }
        }
    }
    return words
}

//return the words that differ by only the sounds listed
function getMinPairs(allophones, words) {
    minPairs = {}
    for(i=0;i<allophones.length-1;i++){
        p1 = allophones[i]
        for(j=i+1;j<allophones.length;j++){
            p2 = allophones[j]
            pairList = []
            
            for(k=0;k<words.length-1;k++){
                w1 = words[k]
                for(l=k+1;l<words.length;l++){
                    w2 = words[l]

                    if(w1.length != w2.length){
                        continue
                    }
                    minPair = true
                    for(c=0;c<w1.length;c++){
                        c1 = w1[c]
                        c2 = w2[c]
                        if(c1 != c2 && !(c1 == p1 && c2 == p2 || c1 == p2 && c2 == p1)){
                            minPair = false
                            continue
                        }
                    }
                    if(minPair){
                        pairList.push([w1,w2])
                    }
                }
            }
            minPairs[[p1,p2]] = pairList
        }
    }
    return minPairs
}

function addMinPairChart(allophonesStr, pairs){
    let allophones = allophonesStr.split(",")
    let table = document.createElement("table")
    table.setAttribute("class", "table-bordered")
    let header = table.createTHead()
    header.setAttribute("class", "thead-light")
    let headerRow = header.insertRow()
    allophones.forEach(p=>{
        th = document.createElement("th")
        th.innerHTML = p
        headerRow.appendChild(th)
    })
    let body = table.createTBody()
    if(pairs.length==0){
        row = body.insertRow()
        cell = row.insertCell()
    }else{
        pairs.forEach(p => {
            row = body.insertRow()
            cell = row.insertCell()
            cell.innerHTML = p[0].join('')
            cell = row.insertCell()
            cell.innerHTML = p[1].join('')
        })
    }
    table.appendChild(document.createElement("br"))
    document.getElementById("minPairChartContainer").appendChild(table)
}

function getDistributions(allophones, words){
    
    let dists = {}
    allophones.forEach(p => {
        dists[p] = []
    })
    words.forEach(w => {
        word = ["#",...w,"#"]
        for(i=1;i<word.length-1;i++){
            if(allophones.includes(word[i])){
                let env = [word[i-1],"_",word[i+1]]
                if(!includesArray(dists[word[i]], env)){
                    dists[word[i]].push(env)
                }
            }
        }
    })
    Object.keys(dists).forEach(p => {
        dists[p] = dists[p].sort()
    })
    return dists
}

function includesArray(data, arr) {
    return data.some(e => Array.isArray(e) && e.every((o, i) => Object.is(arr[i], o)));
}

function addDistributionChart(dists){
    table = document.createElement("table")
    table.setAttribute("class", "table-bordered")
    header = table.createTHead()
    header.setAttribute("class", "thead-light")
    headerRow = header.insertRow()
    let body = table.createTBody()
    let numRows = Math.max.apply(null,Object.values(dists).map(ar => ar.length))

    Object.keys(dists).forEach(p => {
        th = document.createElement("th")
        th.innerHTML = p
        headerRow.appendChild(th)
    })
    for(i=0;i<numRows;i++){
        row = body.insertRow()
        Object.keys(dists).forEach(p => {
            cell = row.insertCell()
            if(dists[p][i]){
                cell.innerHTML = dists[p][i].join('') 
            }
        })
    }
    table.appendChild(document.createElement("br"))
    document.getElementById("distChartContainer").appendChild(table)
}