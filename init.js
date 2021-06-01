////////////////////////////////////////////////////////////////////////////
// Variables
////////////////////////////////////////////////////////////////////////////

let node = document.getElementById('app');
let counterTotalValidMoves = 0;
let currentSelection = new Object();
let existingPoints = [];
let nodeFirstMove = new Object();
let nodeLastMove = new Object();
let nodeOrigination = "";
let proposedIntermediatePoints = [];
let whosTurn = 1;
let lineMade = 0;
var y;

////////////////////////////////////////////////////////////////////////////
// API , Subscribe to request and send response
////////////////////////////////////////////////////////////////////////////
const app = Elm.Main.embed(node, {
    api: 'Client',
    hostname: '',
});

app.ports.startTimer.subscribe((int) => {
    setTimeout(() => {
        app.ports.timeout.send(int);
    }, 10000);
});

app.ports.request.subscribe((message) => {

    //Take the message and turn the string into JSON
    message = JSON.parse(message);

    //Get the JSON response from the function based on the request json object
    var responseObject = executerequest(message);

    // Parse the message to determine a response, then respond:
    app.ports.response.send(responseObject);
});

////////////////////////////////////////////////////////////////////////////
// Get point, Get line
////////////////////////////////////////////////////////////////////////////
function getLine(start, end) 
{

    var theLine = new Object();
    theLine.start = start;
    theLine.end = end;

    console.log(theLine);
    return theLine;
};

function getPoint (x,y) 
{

    var thePoint = new Object();
    thePoint.x = x;
    thePoint.y = y;

    console.log(thePoint);
    return thePoint;
};

function containsPoint(toCheck) 
{

    for (var x = 0; x < existingPoints.length; x++) 
    {
        
        var p = existingPoints[x];
        var checkThisPoint = "Checking " + p.x + "," + p.y;
        checkThisPoint += " -> " + toCheck.x + "," + toCheck.y;

        if (p.x == toCheck.x && p.y == toCheck.y) 
        {
            return true;
        }

    }
    return false;

}
////////////////////////////////////////////////////////////////////////////
// Check if moves valid
////////////////////////////////////////////////////////////////////////////
function checkMoveA(startPoint, endPoint) 
{
    var differenceX = Math.abs(startPoint.x - endPoint.x);
    var differenceY = Math.abs(startPoint.y - endPoint.y);

    //If the proposed end point is already in the line, that is invalid
    if (containsPoint(endPoint)) 
    {

        return false;
    }

    //If the proposed line is not at at a 0, 45, or 90 degree angle, it is invalid
    if (differenceX / differenceY !== 0 && differenceX / differenceY !== 1 && differenceX / differenceY !== Infinity) 
    {

        return false;
    }

    //If the proposed line pass both these tests, it can proceed to next round of testing
    return true;

}

////////////////////////////////////////////////////////////////////////////
// Excute 'messages' Initialize game and return proper responses
////////////////////////////////////////////////////////////////////////////
function executerequest(message) 
{

    var requestMessage = message.msg;
    var requestBody = message.body;

    if (requestMessage == "INITIALIZE") 
    {

        var response = new Object();

        response.msg = "INITIALIZE";
        response.body = new Object();
        
        response.body.newLine = null;
        response.body.heading = "Player 1";
        response.body.message = "Awaiting Player 1's Move";
    
        currentSelection = null;
        whosTurn = 1;
        console.log(response);
    
        return response;
    }
//////////////////////////////////////////
// Node Clicked
//////////////////////////////////////////
    else if (requestMessage == "NODE_CLICKED") 
    {
         //Create an object to use as response
        var response = new Object();
        response.body = new Object();
    
    
        //If there is no node selected, it means the human wants it as their start node
        if (currentSelection == null) 
        {
            if (counterTotalValidMoves < 1) 
            {
                
                //Valid Move
                response.msg = "VALID_START_NODE";
    
                response.body.newLine = null;
                response.body.heading = "Player " + whosTurn;
                response.body.message = "Select a second node to complete the line.";
                //Now we set the current selection to the request value
                currentSelection = requestBody;
               
            } 
            else if ((requestBody.x == nodeFirstMove.x) && (requestBody.y == nodeFirstMove.y) || (requestBody.x == nodeLastMove.x) && (requestBody.y == nodeLastMove.y)) 
            {
    
                nodeOrigination = (requestBody.x == nodeFirstMove.x) && (requestBody.y == nodeFirstMove.y) ? "nodeEndpointA" : "nodeEndpointB";
                
                //Valid Move
                response.msg = "VALID_START_NODE";
    
                response.body.newLine = null;
                response.body.heading = "Player " + whosTurn;
                response.body.message = "Select a second node to complete the line.";
                //Now we set the current selection to the request value
                currentSelection = requestBody;
                
            } 
            else 
            {
    
                //Deselect
                response.msg = "INVALID_START_NODE";
    
                response.body.newLine = null;
                response.body.heading = "Player " + whosTurn;
                response.body.message = "Invalid Start Node!";
    
                currentSelection = null;
    
            }
    
        }
    
    
        //If the chosen end node is the beginning node, we just want to deselect
        else if (requestBody.x == currentSelection.x && requestBody.y == currentSelection.y) 
        {
           
            //DO nothing. This is just a deselection
            response.msg = "INVALID_START_NODE";
    
            response.body.newLine = null;
            response.body.heading = "Player " + whosTurn;
            response.body.message = "Select a node to start.";
    
            currentSelection = null;
    
        }
       
    
    
        //Check and make sure the movement human wants is valid
        else if (checkMoveA(currentSelection, requestBody)) 
        {
            var xValues = [];
            var yValues = [];
            var xLow;
            var xHigh;
            var yLow;
            var yHigh;
            var differenceX;
            var differenceY;
            var differenceValues = [];
            var differenceHighest;
            var numberOfIntermediatePoints;
    
            //If the exisiting points list is empty, that means we need to add the beginning and end points to the existing points list. If it is not empty, we just need to add the new endpoint       
            if (existingPoints.length == 0) 
            {
                existingPoints.push(currentSelection);
            }
    
            //This will identify lowest variable value, highest variable value, and the absolute difference between current and request x's and y's
            xValues.push(currentSelection.x, requestBody.x)
            yValues.push(currentSelection.y, requestBody.y)
            xValues.sort(function (a, b) { return a - b });
            yValues.sort(function (a, b) { return a - b });
            xLow = xValues[0];
            xHigh = xValues[1];
            yLow = yValues[0];
            yHigh = yValues[1];
            differenceX = xHigh - xLow;
            differenceY = yHigh - yLow;
            //This uses the greatest difference to calculate number of intermediary point using *2 -1 forumla.
            differenceValues.push(differenceX, differenceY)
            differenceValues.sort(function (a, b) { return a - b });
            differenceHighest = differenceValues[1];
            numberOfIntermediatePoints = differenceHighest * 2 - 1;
                // console.log(numberOfIntermediatePoints);
    
            //This calculates intermediate point coordinates then pushes to existingPoints array.
            for (var z = .5; z <= numberOfIntermediatePoints / 2; z += .5) 
            {
                var intermediatePointX;
                var intermediatePointY;
    
                //This calculates lines heading 90 and 270 degrees 
                if (xLow == xHigh) 
                {
                    intermediatePointX = xLow;
                    intermediatePointY = yLow + z
                } 
                else 
                {
                    intermediatePointX = xLow + z
                }
    
                //This calculates lines heading 0 and 180 degrees 
                if (yLow == yHigh) 
                {
                    intermediatePointY = yLow;
                }
    
                //This calculates lines heading 315 degrees 
                if (yLow !== yHigh && currentSelection.y > requestBody.y && currentSelection.x < requestBody.x) 
                {
                    intermediatePointY = yHigh - z
                }
    
                //This calculates lines heading 45 degrees 
                if (yLow !== yHigh && currentSelection.y < requestBody.y && currentSelection.x < requestBody.x) 
                {
                    intermediatePointY = yLow + z
                }
    
                //This calculates lines heading 135 degrees 
                if (yLow !== yHigh && currentSelection.y < requestBody.y && currentSelection.x > requestBody.x) 
                {
                    intermediatePointY = yHigh - z
                }
    
                //This calculates lines heading 225 degrees 
                if (yLow !== yHigh && currentSelection.y > requestBody.y && currentSelection.x > requestBody.x) 
                {
                    intermediatePointY = yLow + z
                }
    
    
                // console.log(intermediatePointX + " " + intermediatePointY)
    
                proposedIntermediatePoints.push(
                    {
                        x: intermediatePointX,
                        y: intermediatePointY
                    }
                );
            }
    
            function checkMoveB() 
            {
                for (var z = 0; z < proposedIntermediatePoints.length; z++) 
                {
                    // console.log(proposedIntermediatePoints.length);
                    if (containsPoint(proposedIntermediatePoints[z])) 
                    {
                        console.log("we have a problem" + proposedIntermediatePoints[z].x + " " + proposedIntermediatePoints[z].y)
    
                        return false;
                    } 
                    else 
                    {
                        // console.log("that's ok!" + proposedIntermediatePoints[z].x + " " + proposedIntermediatePoints[z].y)
                    }
                }
                return true;

            }
            if (checkMoveB()) 
            {
                counterTotalValidMoves++;
                //This checks if currentSelection node is also first valid game move, allowing for correct start node selection validation
                if (counterTotalValidMoves == 1)
                {
    
                    nodeFirstMove = currentSelection;
                }
    
                if (nodeOrigination === "nodeEndpointA")
                {
                    nodeFirstMove = requestBody;
                } 
                else if (nodeOrigination === "nodeEndpointA") 
                {
                    //This records new endpoint as the last move, allowing for correct start node selection validation
                    nodeLastMove = requestBody;
                } 
                else 
                {
                    //This records new endpoint as the last move, allowing for correct start node selection validation
                    nodeLastMove = requestBody;
                }
    
                for (var z = 0; z < proposedIntermediatePoints.length; z++) 
                {
                    existingPoints.push(
                        {
                            x: proposedIntermediatePoints[z].x,
                            y: proposedIntermediatePoints[z].y
                        }
                    );
                }
                //This empties holding array
                proposedIntermediatePoints.length = 0;
    
                //This adds new endpoint to existingPoints array
                existingPoints.push(requestBody);
                //This will shift back and forth between 1 and 2            
                whosTurn = (whosTurn % 2) + 1;
    
                //Line is deemed valid, so we create a line
                response.msg = "VALID_END_NODE";
    
                response.body.newLine = getLine(currentSelection, requestBody);
                response.body.heading = "Player " + whosTurn;
                response.body.message = null;
                currentSelection = null;
    
              
                ++lineMade;
                //console.log(lineMade);
                y = 15 - lineMade
            

                //console.log(y);
                
            }  

            else if (requestBody !== checkMoveA)
            {
                
                
                response.msg = "GAME_OVER";
        
                response.body.newLine = getLine(currentSelection, requestBody);
                response.body.heading = "Game Over";
                response.body.message = "Player "+ whosTurn + "Wins!";
                currentSelection = null;
                let gameDone = true;
    
                if (gameDone == true) 
                { 
                    whosTurn = (whosTurn % 2) + 1;
                    //alert ("Game over! player " + whosTurn + " wins! \n Lets play again ")
                        
                    response.msg = "INVALID_START_NODE";
        
                    response.body.newLine = null;
                    response.body.heading = "Game Overr";
                    response.body.message = "Player "+ whosTurn + " Wins!";
                    setTimeout(function(){
                    window.location.reload(1);
                    }, 4000);

                    return response;
                }
                
    
            }

          
            else 
            {
                response.msg = "INVALID_END_NODE";
                response.body.newLine = null;
                response.body.heading = "Player " + whosTurn;
                response.body.message = "Invalid move!";
                currentSelection = null;
    
                //This empties holding array
                proposedIntermediatePoints.length = 0;
            }

        }
        else 
        {
    
            response.msg = "INVALID_END_NODE";
    
            response.body.newLine = null;
            response.body.heading = "Player " + whosTurn;
            response.body.message = "Invalid move!";
            currentSelection = null;
    
        }
        console.log(response);
        return response;
    
    }

    else 
    {

        throw new Exception("Unknown message: " + requestMessage);

    }

}

////////////////////////////////////////////////////////////////////////////
// End of file
////////////////////////////////////////////////////////////////////////////
