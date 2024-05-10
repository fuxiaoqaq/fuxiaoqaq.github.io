---
title: Map
---

:::danger
源代码基于JDK17
:::

## HashMap
### 源码分析

```java

public class HashMap<K,V> extends AbstractMap<K,V>
        implements Map<K,V>, Cloneable, Serializable {
    // 默认的数组初始化容量为16，这个容量只能以2的指数倍进行扩容操作
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16  
    // 数组最大容量  
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // 默认的负载因子值为0.75  
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // 桶的树化阈值，如果一个桶(单向链表)中的节点数量大于该值，则需要将该桶转换成红黑树 
    // 该值至少为8  
    // 是否需要进行树化，需要依据MIN_TREEIFY_CAPACITY常量的值进行判定  
    static final int TREEIFY_THRESHOLD = 8;
    // 桶的反树化阈值，如果一个桶中的红黑树节点数量小于该值，则需要将该桶从红黑树重新转换为链表  
    static final int UNTREEIFY_THRESHOLD = 6;
    // 当集合中的K-V键值对节点过多时，是进行树化操作还是进行扩容操作呢?  
    // 针对这个问题，HashMap 集合使用 MIN_TREEIFY_CAPACITY 常量进行控制  
    // 只有当集合中K-V键值对节点数大于该值，  
    // 并且某个桶中的K-V键值对节点数大于TREEIFY_THRESHOLD的值时，该桶才会进行树化操作  
    static final int MIN_TREEIFY_CAPACITY = 64;

    // 使用该变量记录HashMap集合的数组结构  
    // 数组可以扩容，甚至在进行某些操作时允许数组的长度为0
    transient Node<K,V>[] table;

    // 该Set集合存储了当前集合中所有K-V键值对节点的引用  
    // 可以将该Set集合理解为缓存方案，它不在意每个K-V键值对节点的真实存储位置，  
    // 还可以有效减少HashMap集合的编码工作量  
    transient Set<Map.Entry<K,V>> entrySet;

    // 记录当前K-V键值对节点的数量  
    transient int size;

    // 记录该集合在初始化后进行写操作的次数  
    transient int modCount;

    // table 数组下一次进行扩容操作的门槛，这个门槛值=当前集合容量值 * loadFactor  
    int threshold;

    // 设置的负载因子，默认为DEFAULT_LOAD_FACTOR，可以设置该值大于1  
    final float loadFactor;

    /*
     * HashMap 集合使用 HashMap.Node 类的对象构建单向链表(中的每一个节点)，
     * 以HashMap 集合中数组(前面提到的HashMap集合中table变量所代表的数组)中的每一个
     * 索引位上的数据对象为基础，都可以构建一个独立的单向链表.
     */
    static class Node<K,V> implements Map.Entry<K,V> {
        // 该属性主要用于存储当前K-V键值对节点排列在HashMap集合中所依据的Hash计算结果
        // 它的赋值过程可以参考HashMap集合中的newNode()方法和replacementNode()方法
        final int hash;
        // 记录当前K-V键值对节点的Key键信息
        // 因为K-V键值对节点在HashMap集合中的排列位置完全参考Key键对象的hashCode()方法的返回值， 
        // 所以K-V键值对节点一旦完成初始化操作，该变量就不允许变更了
        final K key;
        // 记录当前K-V键值对节点的Value值信息
        V value;
        // 因为需要使用Node节点构建单向链表，所以需要next属性存储单向链表中当前节点的下一个节点引用
        Node<K,V> next;

        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }

        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }

        public final boolean equals(Object o) {
            if (o == this)
                return true;

            return o instanceof Map.Entry<?, ?> e
                    && Objects.equals(key, e.getKey())
                    && Objects.equals(value, e.getValue());
        }
    }
    /**
     * 当某个索引位上的链表长度达到指定的阈值(默认为单向链表长度超过 8)时，
     * 单向链表会转化为红黑树;当红黑树中的节点足够少(默认为红黑树中的节点数量少于 6 个) 时，红黑树会转换为单向链表
     */
    static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        // 当前节点的双亲节点(父节点)
        TreeNode<K,V> parent;  // red-black tree links
        // 当前节点的左儿子节点
        TreeNode<K,V> left;
        // 当前节点的右儿子节点
        TreeNode<K,V> right;
        TreeNode<K,V> prev;    // needed to unlink next upon deletion
        // 当前节点的颜色是红色还是黑色
        boolean red;
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }
    }
    /**
     * (h = key.hashCode()) ^ (h >>> 16)
     * hash(Object)方法通过以上表达式得到指定对象的Hash值，这里是取得当前对象的Hash值，
     * 首先进行带符号位的右移 16 位操作(这时候对象 Hash 值的高位段就变成了低位段)，然后与对象原来的Hash值进行异或运算
     */
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
    /*
     * tab[i = (n - 1) & hash]
     * 在putVal(int, K, V, boolean, boolean)方法中，通过该表达式得到某个Hash值应该存储
     * 在数组中的哪个索引位上(哪一个桶上);需要注意的是，表达式中的n表示当前数组的长度，
     * 将长度减一后的与运算结果不可能超过 n-1(因为这相当于取余操作)，因此可以确定Hash值代表的当前对象在当前数组中的哪个索引位上
     */
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }    
}
```
### 为什么严格要求数组大小为2的幂数
:::tip
- 要求容量必须是2的幂次方的原因是为了提高散列（Hash）算法的效率和避免哈希冲突。
- HashMap使用了一种散列算法来将键（Key）映射到存储桶（Bucket）的索引位置。这个索引位置是通过对键的哈希码进行一系列计算得出的。当容量是2的幂次方时，可以使用位运算来代替较慢的取余运算，从而提高计算速度。
- 使用位与运算&可以快速计算出索引位置，因为容量是2的幂次方，其二进制形式的最后几位都是1，而位与运算可以保留哈希码中与容量对应位的值，将其他位的值置为0。
- 容量为2的幂次方还能够更均匀地分布哈希码，减少哈希冲突的概率。如果容量不是2的幂次方，那么使用位与运算时会导致某些索引位置无法访问到，从而导致哈希表中的存储桶没有充分利用。这可能会导致某些桶中的元素数量过多，增加查找和插入操作的时间复杂度。
- 为了保证散列算法的高效性和减少哈希冲突，HashMap严格要求容量必须是2的幂次方，并且在扩容时会将容量扩展为大于当前容量的最小2的幂次方。
:::
### 初始化以及扩容总结
:::warning
#### 初始化
- 默认构造器初始化，默认的负载因子值为0.75，默认大小为16。
- 指定默认大小的构造器进行初始化，会以指定的默认大小最近接近2的幂数的数值进行初始化，例如指定30 初始化为 32。
#### 数据结构
- HashMap 是以数组 + （链表或红黑树）结构存储的。
- 数组 table 的容量并不是 HashMap 集合的容量，因为从数组中的任意一个索引位出发，都可能存在一个单向链表或一棵红黑树;即使在数组中的某些索引位上还没有存储任何 K-V 键值对节点的情况下，数组也会进行扩容操作。
#### 链表转红黑树逻辑
- 转换条件
  1. 在向单向链表中添加新的节点后，链表中的节点总数大于某个值。
  2. HashMap 集合中的 table 数组长度大于 64。
#### 红黑树退化为链表逻辑
- 情况1. 当HashMap集合中的table数组进行扩容操作时
  1. 为了保证依据 K-V 键值对节点中 Key 键信息的 Hash 值，HashMap集合仍然能正确定位到节点存储的数组索引位，
     需要依次对这些索引位上的红黑树进行拆分操作——拆分结果可能形成两棵红黑树，一棵红黑树被引用到原来的索引位上;
     另一棵红黑树被引用到“原索引值 + 原数组长度”号索引位上.
  2. 如果以上两棵红黑树的其中一棵中的节点总数小于或等于 UNTREEIFY_THRESHOLD 常量值(该常量值在 JDK 1.8+中的值为 6)
  ```java
     if (loHead != null) {
        if (lc <= UNTREEIFY_THRESHOLD)
            tab[index] = loHead.untreeify(map);
        else {
            tab[index] = loHead;
            if (hiHead != null) // (else is already treeified)
                loHead.treeify(tab);
        }
    }
    if (hiHead != null) {
        if (hc <= UNTREEIFY_THRESHOLD)
            tab[index + bit] = hiHead.untreeify(map);
        else {
            tab[index + bit] = hiHead;
            if (loHead != null)
                hiHead.treeify(tab);
        }
    }
  ```   
- 情况2. 当使用 HashMap 集合中的 remove(K)方法进行 K-V 键值对节点的移除操作时
  1. 在这种情况下，在 table 数组中，如果某个索引位上移除的红黑树节点足够多，导致根 节点的左儿子节点为 null，
     或者根节点的右儿子节点为 null，甚至根节点本身为 null，那么可以将这棵红黑树转换为单向链表
#### 扩容规则
- 扩容会进行重hash,把一些数据迁移到新的哈希表里面
- 默认的负载因子值为0.75，默认大小为16
- 计算出扩容门槛值为 0.75 * 16 为12 ，当存储的大小等于12的时候 触发扩容机制
- 扩容到 16 * 2 = 32 并且计算出下次触发扩容的门槛值 0.75 * 32 = 24 当存储的大小等于24的时候 会触发下一次扩容
:::
## LinkedHashMap
### 源码分析
```java

public class LinkedHashMap<K,V>
        extends HashMap<K,V>
        implements Map<K,V>
{
    static class Entry<K,V> extends HashMap.Node<K,V> {
        java.util.LinkedHashMap.Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }
    // 双向链表的头节点引用
    transient LinkedHashMap.Entry<K,V> head;
    // 双向链表的尾节点引用，根据前面提到的LinkedHashMap集合中的构造设置，
    / 这里的尾节点可能是最后添加到LinkedHashMap集合中的节点， 
    // 也可能是LinkedHashMap集合中最近被访问的节点
    transient LinkedHashMap.Entry<K,V> tail;

    // 该属性表示LinkedHashMap集合中特有的双向链表中节点的排序特点
    // 如果为 false(默认为 false)，那么按照节点被添加到 LinkedHashMap 集合中的顺序进行排序; 
    // 如果为true，那么按照节点最近被操作(修改操作或读取操作)的顺序进行排序
    final boolean accessOrder;
}
```
### 总结
:::warning
#### 特性
- 根据 LinkedHashMap 集合中每个节点的 before、after 属性形成的双向链表，串联 LinkedHashMap 集合中的所有节点;这些节点在双向链表中的顺序和这些节点处于哪一个 桶结构中，桶结构本身是单向链表结构还是红黑树结构并没有关系，有关系的只是这个节 点代表的 K-V 键值对节点在时间维度上被添加到 LinkedHashMap 集合中的顺序。
- LinkedHashMap 集合中的 head 属性和 tail 属性可以保证被串联的节点可以跨越不同的 桶结构。需要注意的是，根据 LinkedHashMap 集合的初始化设置，head 属性和 tail 属性指 向的节点可能会发生变化。
- LinkedHashMap 可以看作是 `HashMap` 和 `LinkedList` 的结合：它在 HashMap 的基础上添加了一条双向链表，`默认`存储各个元素的插入顺序，但由于这条双向链表，使得 LinkedHashMap 可以实现 `LRU`缓存淘汰策略，因为我们可以设置这条双向链表按照`元素的访问次序`进行排序
- LinkedHashMap 是 HashMap 的子类，所以它具备 HashMap 的所有特点，其次，它在 HashMap 的基础上维护了一条`双向链表`，该链表存储了**所有元素**，`默认`元素的顺序与插入顺序**一致**。若`accessOrder`属性为`true`，则遍历顺序按元素的访问次序进行排序
#### 实现LRU
#### 1.该方法可以移除`最靠近链表头部`的一个节点，而在`get()`方法中可以看到下面这段代码，其作用是挪动结点的位置
```java
protected boolean removeEldestEntry(java.util.Map.Entry<K, V> eldest) {
    return false;
}
```
#### 2.只要调用了`get()`且`accessOrder = true`，则会将该节点更新到链表`尾部`，具体的逻辑在`afterNodeAccess()`中
```java
if (this.accessOrder) {
    this.afterNodeAccess(e);
}
```
#### 3.具体实现
- 指定`accessOrder = true`可以设定链表按照访问顺序排列，通过提供的构造器可以设定`accessOrder`
```java
public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```
- 重写`removeEldestEntry()`方法，内部定义逻辑，通常是判断`容量`是否达到上限，若是则执行淘汰。
#### 自定义实现LRU
```java
class LRUCache {  
    LinkedHashMap<Integer, Integer> map;   
    int capacity;  
    // 使用开启了accessOrder的linkedHashMap，表示其具备访问有序性。 
    public LRUCache(int capacity) { 
        this.capacity = capacity;       
        map = new LinkedHashMap<>(capacity, 0.75f, true);    
    }  
    public int get(int key) { 
        if (map.containsKey(key))      
              return map.get(key);
        return -1;    
    }  
    public void put(int key, int value) {   
         // 先判断是否有这个key  
        if (map.containsKey(key)) {   
                 map.put(key, value);            
                 return;        
                 }
        // 移除第一个元素                  
        if (map.size() == this.capacity) {            
            for (int firstKey : map.keySet()) {               
                 map.remove(firstKey);               
                 break;           
            }        
        }        
        map.put(key, value);   
   }
}  
```
:::
## TreeMap
### 源码分析
```java
import java.util.Iterator;
import java.util.Map;

public class TreeMap<K,V>
        extends AbstractMap<K,V>
        implements NavigableMap<K,V>, Cloneable, java.io.Serializable
{
 
    // 这个比较器对象非常重要，它记录了红黑树中各节点排列顺序的判定逻辑
    // 该比较器对象可以为null，如果为null，那么在判定红黑树节点的排列顺序时， 
    // 会采用TreeMap集合原生的基于K-V键值对Key-Hash值的判定方式  
    private final Comparator<? super K> comparator;

    // 该变量主要用于记录当前TreeMap集合中红黑树的根节点
    private transient java.util.TreeMap.Entry<K,V> root;

    //该变量主要用于记录当前TreeMap集合中K-V键值对节点的数量
    private transient int size = 0;

    //modCount变量主要用于记录当前TreeMap集合执行写操作的次数
    private transient int modCount = 0;
    
    // 默认的构造方法，会设置TreeMap集合中的比较器对象comparator为null
    // 实例化的TreeMap集合会使用K-V键值对节点的Key键信息的Hash值进行排序
    public TreeMap() {
        comparator = null;
    }
    // 该构造方法可以为当前TreeMap集合对象设置一个比较器对象
    public TreeMap(Comparator<? super K> comparator) {
        this.comparator = comparator;
    }
    // 该构造方法可以将一个特定Map集合中的所有K-V键值对节点复制(引用)到新的TreeMap集合中
    // 因为源集合没有实现SortedMap接口，所以将当前TreeMap集合的比较器对象comparator设置为null
    public TreeMap(Map<? extends K, ? extends V> m) {
        comparator = null;
        putAll(m);
    }
    // 该构造方法可以将一个实现了SortedMap接口的集合中的所有对象复制到新的TreeMap集合中
    // 因为原集合实现了SortedMap接口，所以将源集合使用的比较器对象comparator赋值给当前集合
    public TreeMap(SortedMap<K, ? extends V> m) {
        comparator = m.comparator();
        try {
            buildFromSorted(m.size(), m.entrySet().iterator(), null, null);
        } catch (java.io.IOException | ClassNotFoundException cannotHappen) {
        }
    }
    private void buildFromSorted(int size, Iterator<?> it,
                                 java.io.ObjectInputStream str,
                                 V defaultVal)
            throws  java.io.IOException, ClassNotFoundException {
        this.size = size;
        // 递归进行处理
        root = buildFromSorted(0, 0, size-1, computeRedLevel(size),
                it, str, defaultVal);
    }

    // 该方法中的level变量表示当前正在构建的满二叉树的深度
    // lo变量表示当前子树的第一个节点索引位，在进行第一次递归时从0号索引位开始
    // hi变量表示当前子树的最后一个节点索引位，在进行第一次递归时从size-1号索引位开始 
    // redLevel变量表示红黑树中红节点的起始深度
    private final Entry<K,V> buildFromSorted(int level, int lo, int hi,
                                                               int redLevel,
                                                               Iterator<?> it,
                                                               java.io.ObjectInputStream str,
                                                               V defaultVal)
            throws  java.io.IOException, ClassNotFoundException {
        // 如果条件成立，则说明满二叉树构造完成，返回null
        if (hi < lo) return null;
        // 找到本次遍历集合的中间索引位，代码很好理解:右移一位，表示除以2。
        int mid = (lo + hi) >>> 1;

        Entry<K,V> left  = null;
        // 如果当前子树的最小索引值小于当前确定的中间索引值，
        // 则继续构建下一级子树(以当前中间索引位为根节点的左子树)
        // 在构造下一级左子树时，指定的满二叉树深度+1，子树的起始索引值为0，子树的结束索引值为mid-1
        if (lo < mid)
            left = buildFromSorted(level+1, lo, mid - 1, redLevel,
                    it, str, defaultVal);

        // extract key and/or value from iterator or stream
        K key;
        V value;
        // 以上代码只是确定了子树的索引位，还没有真正开始将集合构建成满二叉树
        // 这里开始进行满二叉树的构建:一共有4种可能的场景
        // 当 it != null、defaultVal == null 时，以 Map.Entry 的形式取得对象，构建本次红黑树的节点 
        // 当it != null、defaultVal != null时，以K-V键值对的形式取得对象，构建本次红黑树的节点
        // key的值来源于it迭代器，value的值默认为defaultVal
        // 当 it == null、defaultVal == null 时，以对象反序列化的形式取得对象，构建本次红黑树的节点
        // key和value的值都来源于str反序列化读取的对象信息
        // 当 it == null、defaultVal != null 时，以对象反序列化的形式取得对象，构建本次红黑树的节点 
        // key的值来源于str反序列化读取的对象信息，value的值采用默认值defaultVal
        if (it != null) {
            if (defaultVal==null) {
                Map.Entry<?,?> entry = (Map.Entry<?,?>)it.next();
                key = (K)entry.getKey();
                value = (V)entry.getValue();
            } else {
                key = (K)it.next();
                value = defaultVal;
            }
        } else { // use stream
            key = (K) str.readObject();
            value = (defaultVal != null ? defaultVal : (V) str.readObject());
        }

        java.util.TreeMap.Entry<K,V> middle =  new java.util.TreeMap.Entry<>(key, value, null);

        // color nodes in non-full bottommost level red
        // 如果当前正在构建的满二叉树的深度刚好是构建满二叉树前计算出的红节点的深度，
        // 则将本次构建的middle节点的颜色设置为红色
        if (level == redLevel)
            middle.color = RED;
        // 如果当前节点的左子树不为null，则将当前节点和它的左子树进行关联
        if (left != null) {
            middle.left = left;
            left.parent = middle;
        }
        // 如果之前计算得到的当前节点的子树的结束索引值大于计算得到的中间索引值，
        // 则以当前middle节点为根节点，构建右子树
        if (mid < hi) {
            java.util.TreeMap.Entry<K,V> right = buildFromSorted(level+1, mid+1, hi, redLevel,
                    it, str, defaultVal);
            middle.right = right;
            right.parent = middle;
        }

        return middle;
    }
     //批量添加
     public void putAll(Map<? extends K, ? extends V> map) {
        int mapSize = map.size();
        // 如果当前TreeMap集合中的K-V键值对节点数量为0，要添加的K-V键值对节点数量不为0，
        // 并且当前传入的Map集合实现了SortedMap接口(说明是有序的Map集合)，则继续进行后续判断
        if (size==0 && mapSize!=0 && map instanceof SortedMap) {
            // 取得传入的有序Map集合的比较器对象comparator
            // 如果比较器对象与当前TreeMap集合使用的比较器对象是同一个对象，
            // 则使用前面介绍的buildFromSorted()方法构建一棵新的红黑树
            // 这意味着不再对在执行该方法前，当前TreeMap集合中已有的K-V键值对节点进行维护
            if (Objects.equals(comparator, ((SortedMap<?,?>)map).comparator())) {
                ++modCount;
                try {
                    buildFromSorted(mapSize, map.entrySet().iterator(),
                                    null, null);
                } catch (java.io.IOException | ClassNotFoundException cannotHappen) {
                }
                return;
            }
        }
        
        // 如果当前TreeMap集合的状态不能使上述两个嵌套的if条件成立，
        // 则对当前批量添加的K-V键值对节点逐一进行操作
        super.putAll(map);
    }
     private void addEntryToEmptyMap(K key, V value) {
        // 在这种情况下，需要进行compare操作，
        // 一个作用是保证当前红黑树使用的compare比较器对方法运行时传入的key是有效的; 
        // 另一个作用是确保key不为null
        compare(key, key); // type (and possibly null) check
        // 创建一个root节点，修改modCount变量代表的操作次数
        // 完成节点添加操作
        root = new Entry<>(key, value, null);
        size = 1;
        modCount++;
    }
    //添加
    //1.通过堆查询的方式找到合适的节点，将新的节点添加成前者的左叶子节点或右叶 子节点。
    //2.节点添加操作可能导致红黑树失去平衡性，需要使红黑树重新恢复平衡性。
    // put()方法中的代码主要用于处理步骤(1)
    // put()方法中调用的fixAfterInsertion()方法主要用于处理步骤(2)
    private V put(K key, V value, boolean replaceOld) {
        Entry<K,V> t = root;
        // 如果该条件成立，则表示当前红黑树为null，即没有红黑树结构
        if (t == null) {
            addEntryToEmptyMap(key, value);
            return null;
        }
        int cmp;
        Entry<K,V> parent;
        // split comparator and comparable paths
        // comparator对象是在TreeMap集合实例化时设置的比较器
        // 根据前文中TreeMap集合的实例化过程，comparator对象可能为null
        Comparator<? super K> cpr = comparator;
        // 如果comparator对象不为null，那么基于这个comparator对象寻找添加节点的位置
        if (cpr != null) {
            do {
                parent = t;
                cmp = cpr.compare(key, t.key);
                // 如果条件成立，则说明要添加的节点的权值小于当前比较的红黑树中节点的权值 
                // 在t节点的左子树中寻找添加节点的位置
                if (cmp < 0)
                    t = t.left;
                // 如果条件成立，则说明要添加的节点的权值大于当前比较的红黑树中节点的权值    
                else if (cmp > 0)
                    t = t.right;
                // 否则说明要添加的节点的权值等于当前比较的红黑树中节点的权值
                // 将节点添加操作转换为节点修改操作    
                else {
                    V oldValue = t.value;
                    if (replaceOld || oldValue == null) {
                        t.value = value;
                    }
                    return oldValue;
                }
            } while (t != null);
        // 如果comparator对象为null，那么基于key自带的comparator对象寻找添加节点的位置 
        // 寻找节点添加位置的逻辑和以上条件代码块的逻辑相同
        } else {
            Objects.requireNonNull(key);
            @SuppressWarnings("unchecked")
            Comparable<? super K> k = (Comparable<? super K>) key;
            do {
                parent = t;
                cmp = k.compareTo(t.key);
                if (cmp < 0)
                    t = t.left;
                else if (cmp > 0)
                    t = t.right;
                else {
                    V oldValue = t.value;
                    if (replaceOld || oldValue == null) {
                        t.value = value;
                    }
                    return oldValue;
                }
            } while (t != null);
        }
        addEntry(key, value, parent, cmp < 0);
        return null;
    }
}
```
### 总结
:::warning
#### 特性
- 基于红黑树,底层是由`红黑树`这种数据结构实现的，所以操作的时间复杂度恒为`O(logN)`,线程不安全
- 默认情况下按照`key`自然排序，另一种是可以通过传入定制的`Comparator`进行自定义规则排序
- TreeMap 可以对`key`进行自然排序或者自定义排序，自定义排序时需要传入`Comparator`，而自然排序要求`key`实现了`Comparable`接口
    ```java
    // 按照 key 自然排序，Integer 的自然排序是升序
    TreeMap<Integer, Object> naturalSort = new TreeMap<>();
    // 定制排序，按照 key 降序排序
    TreeMap<Integer, Object> customSort = new TreeMap<>((o1, o2) -> Integer.compare(o2, o1));
    ```
:::

## HashTable
### 总结
:::warning
#### 特性
- 使用数组+链表,线程安全
- HashTable 默认长度为11，负载因子为0.75，即元素个数达到数组长度的 75% 时，会进行一次扩容，每次扩容为原来数组长度的2倍
:::

## WeakHashMap
### 总结
:::warning
#### 特性
- 使用数组+链表,它依赖普通的`Map`进行实现，是一个非线程安全的集合
- WeakHashMap 日常开发中比较少见，它是基于普通的`Map`实现的，而里面`Entry`中的键在每一次的`垃圾回收`都会被清除掉，所以非常适合用于`短暂访问`、`仅访问一次的元素`，缓存在`WeakHashMap`中，并尽早地把它回收掉
- 默认长度16 2的幂数，负载因子为0.75，即元素个数达到数组长度的 75% 时，会进行一次扩容，每次扩容为原来数组长度的2倍
- 它的键是一种**弱键**，放入 WeakHashMap 时，随时会被回收掉，所以不能确保某次访问元素一定存在
- WeakHashMap 通常作为**缓存**使用，适合存储那些**只需访问一次**、或**只需保存短暂时间**的键值对
:::