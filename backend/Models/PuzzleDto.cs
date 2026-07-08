namespace Backend.Models;

public class CubeDto
{
    public int X { get; set; }
    public int Y { get; set; }
    public int Z { get; set; }

    // 0 = blue, 1 = yellow
    // This is important because the puzzle should only pass when both shape and colour positions match.
    public int ColorIndex { get; set; }
}

public class PuzzleDto
{
    public int Id { get; set; }
    public int Seed { get; set; }
    public string Difficulty { get; set; } = "Easy";

    public List<CubeDto> Cubes { get; set; } = new();
    public BlockOrientationDto TargetOrientation { get; set; } = new();

    //for debugging, will not show this to the player
    public List<PuzzleMoveDto> SolutionMoves { get; set; } = new();
}


public class BlockOrientationDto
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
    public double W { get; set; } = 1;
}

public class PuzzleMoveDto
{
    public string Axis { get; set; } = "X";
    public int Degrees { get; set; }
}