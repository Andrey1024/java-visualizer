package ru.avlasov.ast.visitors;

import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.resolution.declarations.ResolvedReferenceTypeDeclaration;
import ru.avlasov.ast.nodes.AbstractNode;
import ru.avlasov.ast.nodes.ClassNode;
import ru.avlasov.ast.nodes.EnumNode;
import ru.avlasov.ast.nodes.InterfaceNode;

import java.util.List;

public class ClassExtractor extends VoidVisitorAdapter<List<AbstractNode>> {

    @Override
    public void visit(ClassOrInterfaceDeclaration expr, List<AbstractNode> types) {
        super.visit(expr, types);
        ResolvedReferenceTypeDeclaration type = expr.resolve();
        if (type.isInterface()) {
            types.add(new InterfaceNode(type.asInterface()));
        } else if (type.isClass()) {
            types.add(new ClassNode(type.asClass()));
        } else if (type.isEnum()) {
            types.add(new EnumNode(type.asEnum()));
        }
    }
}